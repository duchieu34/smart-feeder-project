import { PrismaClient } from "@prisma/client";
import { feedNow } from "../mqttService.js";


const prisma = new PrismaClient();

//Lấy danh sách thiết bị
export const getDevices = async (req, res) => {
    const devices = await prisma.device.findMany();
    return res.json(devices);
};

//Tạo mới thiết bị
export const createDevice = async (req, res) => {
    try {
        const { name, deviceId } = req.body;
        const userId = req.user.id;

        const existed = await prisma.device.findFirst({
            where: { deviceId }
        });
        if (existed) {
            return res.status(400).json({ message: "Device existed! Cannot create new device" });
        }
        const device = await prisma.device.create({
            data: { name, deviceId, userId }
        });
        return res.json({ message: "Created new device!", device });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}

//Công tắc cho ăn ngay
export const feedNowController = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { amount = 50 } = req.body; 

        // 1. Gửi lệnh MQTT như cũ
        await feedNow(deviceId, amount); 

        // [MỚI] 2. Tìm thông tin thiết bị trong DB để lấy ID (dạng số)
        const device = await prisma.device.findUnique({
            where: { deviceId: deviceId }
        });

        // [MỚI] 3. Lưu Log vào Database
        if (device) {
            await prisma.feedingLog.create({
                data: {
                    deviceId: device.id,      // ID số của thiết bị trong DB
                    amount: Number(amount),   // Lượng ăn
                    type: "manual",           // Đánh dấu là ăn thủ công
                }
            });
            console.log(`[DB] Đã lưu log ăn thủ công: ${amount}g cho ${deviceId}`);
        }

        return res.json({ message: "Feed command sent!", amount });
        
    } catch (e) {
        console.error("Feed error:", e);
        return res.status(500).json({ error: e.message }); 
    }
}

export const getDeviceStats = async (req, res) => {
    try {
        const { deviceId } = req.params;

        // 1. Tìm ID của thiết bị dựa trên deviceId (string)
        const device = await prisma.device.findUnique({
            where: { deviceId: deviceId }
        });

        if (!device) return res.status(404).json({ error: "Device not found" });

        // 2. Lấy thời gian 7 ngày trước
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Lấy từ 6 ngày trước + hôm nay
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // 3. Lấy dữ liệu FeedingLog
        const logs = await prisma.feedingLog.findMany({
            where: {
                deviceId: device.id,
                createdAt: {
                    gte: sevenDaysAgo
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // 4. Xử lý dữ liệu: Gom nhóm theo ngày
        // Kết quả mong muốn: { "02/01": 150, "03/01": 200, ... }
        const statsMap = {};
        
        // Tạo khung sẵn cho 7 ngày (để ngày nào không ăn vẫn hiện 0g)
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }); // VD: "03/01"
            statsMap[dateStr] = 0;
        }

        // Cộng dồn lượng ăn
        logs.forEach(log => {
            const dateStr = new Date(log.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            if (statsMap[dateStr] !== undefined) {
                statsMap[dateStr] += log.amount;
            }
        });

        // Chuyển đổi về dạng mảng để Frontend dễ vẽ
        // Đảo ngược để hiện từ quá khứ -> hiện tại
        const labels = Object.keys(statsMap).reverse(); 
        const data = Object.values(statsMap).reverse();

        return res.json({ labels, data });

    } catch (e) {
        console.error("Stats error:", e);
        return res.status(500).json({ error: e.message });
    }
};