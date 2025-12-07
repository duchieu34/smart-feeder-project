import { PrismaClient } from "@prisma/client";
import { startCronJob, stopCronJob } from "../mqttService.js";

const prisma = new PrismaClient();

// CREATE SCHEDULE
export const createSchedule = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { timeCron, amount } = req.body;
        const userId = req.user.id;

        const device = await prisma.device.findFirst({
            where: { id: Number(deviceId), userId }
        });
        if (!device) return res.status(404).json({ message: "Device not found" });

        const schedule = await prisma.feedingSchedule.create({
            data: {
                deviceId: device.id,
                timeCron,
                amount
            }
        });

        startCronJob(schedule);

        return res.json({ message: "Schedule created", schedule });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

// GET SCHEDULES
export const getSchedules = async (req, res) => {
    try {
        const { deviceId } = req.params;

        const schedules = await prisma.feedingSchedule.findMany({
            where: { deviceId: Number(deviceId) },
            orderBy: { createdAt: "desc" }
        });

        return res.json(schedules);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

// UPDATE SCHEDULE
export const updateSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { timeCron, amount, enabled } = req.body;

        const old = await prisma.feedingSchedule.findUnique({
            where: { id: Number(scheduleId) }
        });

        if (!old) return res.status(404).json({ message: "Schedule not found" });

        const schedule = await prisma.feedingSchedule.update({
            where: { id: Number(scheduleId) },
            data: { timeCron, amount, enabled }
        });

        stopCronJob(old.id);

        if (schedule.enabled) startCronJob(schedule);

        return res.json({ message: "Schedule updated", schedule });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

// DELETE SCHEDULE
export const deleteSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;

        await prisma.feedingSchedule.delete({
            where: { id: Number(scheduleId) }
        });

        stopCronJob(Number(scheduleId));

        return res.json({ message: "Schedule deleted" });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

// TOGGLE SCHEDULE
export const toggleSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;

        const schedule = await prisma.feedingSchedule.findUnique({
            where: { id: Number(scheduleId) }
        });

        if (!schedule) return res.status(404).json({ message: "Schedule not found" });

        const updated = await prisma.feedingSchedule.update({
            where: { id: schedule.id },
            data: { enabled: !schedule.enabled }
        });

        if (updated.enabled) startCronJob(updated);
        else stopCronJob(updated.id);

        return res.json({ message: "Schedule toggled", schedule: updated });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

