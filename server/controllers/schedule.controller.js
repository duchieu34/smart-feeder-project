import { PrismaClient } from "@prisma/client";
import { startCronJob, stopCronJob } from "../mqttService.js";

const prisma = new PrismaClient();

// 1. Tạo lịch mới
export const createSchedule = async (req, res) => {
    try {
        const { deviceId, timeCron, amount } = req.body;

        // 1. Tìm thiết bị (Giữ nguyên)
        const device = await prisma.device.findUnique({
            where: { deviceId: deviceId }
        });

        if (!device) return res.status(404).json({ error: "Không tìm thấy thiết bị" });

    
        const existingSchedule = await prisma.feedingSchedule.findFirst({
            where: {
                deviceId: device.id, 
                timeCron: timeCron   
            }
        });

        if (existingSchedule) {
            return res.status(400).json({ error: "Giờ ăn này đã tồn tại rồi! Vui lòng chọn giờ khác." });
        }


        // 3. Tạo lịch mới (Giữ nguyên)
        const newSchedule = await prisma.feedingSchedule.create({
            data: {
                deviceId: device.id,
                timeCron,
                amount: parseInt(amount),
                enabled: true
            }
        });

        // 4. Kích hoạt Cron Job (Giữ nguyên code hôm qua)
        startCronJob(newSchedule); 

        res.json({ message: "Tạo lịch thành công", schedule: newSchedule });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi khi tạo lịch" });
    }
};
// 2. Lấy danh sách (Giữ nguyên)
export const getSchedules = async (req, res) => {
    try {
        const schedules = await prisma.feedingSchedule.findMany({
            include: { device: true }
        });
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: "Lỗi lấy danh sách lịch" });
    }
};

// 3. Cập nhật lịch
export const updateSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { timeCron, amount } = req.body;

        const updated = await prisma.feedingSchedule.update({
            where: { id: parseInt(scheduleId) },
            data: { timeCron, amount: parseInt(amount) }
        });

        stopCronJob(updated.id);  
        startCronJob(updated);    

        res.json({ message: "Cập nhật thành công", schedule: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi cập nhật lịch" });
    }
};

// 4. Xóa lịch
export const deleteSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;

        stopCronJob(parseInt(scheduleId));

        await prisma.feedingSchedule.delete({
            where: { id: parseInt(scheduleId) }
        });
        
        res.json({ message: "Đã xóa lịch" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi xóa lịch" });
    }
};

// 5. Bật/Tắt lịch (Toggle)
export const toggleSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { enabled } = req.body;

        const updated = await prisma.feedingSchedule.update({
            where: { id: parseInt(scheduleId) },
            data: { enabled }
        });

        // 5. Logic bật tắt
        if (enabled) {
            startCronJob(updated);
        } else {
            stopCronJob(updated.id);
        }

        res.json({ message: "Đã thay đổi trạng thái", schedule: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi thay đổi trạng thái" });
    }
};