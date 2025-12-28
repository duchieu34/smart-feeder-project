// server/controllers/schedule.controller.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. Tạo lịch mới (Create)
export const createSchedule = async (req, res) => {
    try {
        const { deviceId, timeCron, amount } = req.body;

        // Kiểm tra xem thiết bị có tồn tại không
        const device = await prisma.device.findUnique({
            where: { deviceId: deviceId }
        });

        if (!device) {
            return res.status(404).json({ error: "Không tìm thấy thiết bị với ID này" });
        }

        const newSchedule = await prisma.feedingSchedule.create({
            data: {
                deviceId: device.id, // Lưu ý: Database dùng id (Int), không phải deviceId (String)
                timeCron,
                amount: parseInt(amount),
                enabled: true
            }
        });

        res.json({ message: "Tạo lịch thành công", schedule: newSchedule });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi khi tạo lịch" });
    }
};

// 2. Lấy danh sách lịch (Read)
export const getSchedules = async (req, res) => {
    try {
        const schedules = await prisma.feedingSchedule.findMany({
            include: { device: true } // Kèm thông tin thiết bị
        });
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: "Lỗi lấy danh sách lịch" });
    }
};

// 3. Cập nhật lịch (Update)
export const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params; // ID của lịch
        const { timeCron, amount } = req.body;

        const updated = await prisma.feedingSchedule.update({
            where: { id: parseInt(id) },
            data: { timeCron, amount: parseInt(amount) }
        });

        res.json({ message: "Cập nhật thành công", schedule: updated });
    } catch (error) {
        res.status(500).json({ error: "Lỗi cập nhật lịch" });
    }
};

// 4. Xóa lịch (Delete)
export const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.feedingSchedule.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: "Đã xóa lịch" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi xóa lịch" });
    }
};

// 5. Bật/Tắt lịch (Toggle)
export const toggleSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { enabled } = req.body; // true hoặc false

        const updated = await prisma.feedingSchedule.update({
            where: { id: parseInt(id) },
            data: { enabled }
        });
        res.json({ message: "Đã thay đổi trạng thái", schedule: updated });
    } catch (error) {
        res.status(500).json({ error: "Lỗi thay đổi trạng thái" });
    }
};