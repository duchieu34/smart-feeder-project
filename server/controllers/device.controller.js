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
        
        // 1. Thêm giá trị mặc định (ví dụ 50g) nếu req.body.amount bị null/undefined
        const { amount = 50 } = req.body; 

        // 2. Thêm 'await' nếu hàm feedNow trả về Promise (thường là có)
        // Truyền amount vào hàm service
        await feedNow(deviceId, amount); 

        // Trả về thông báo kèm số lượng để frontend biết
        return res.json({ message: "Feed command sent!", amount });
        
    } catch (e) {
        console.error("Feed error:", e); // Nên log lỗi ra console server để debug
        return res.status(500).json({ error: e.message }); 
    }
}