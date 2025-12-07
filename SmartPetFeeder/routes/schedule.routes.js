import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createSchedule, getSchedules, updateSchedule, deleteSchedule, toggleSchedule } from "../controllers/schedule.controller.js";

const router = Router();

router.post("/devices/:deviceId/schedules", authMiddleware, createSchedule);

router.get("/devices/:deviceId/schedules", authMiddleware, getSchedules);

router.put("/schedules/:scheduleId", authMiddleware, updateSchedule);

router.delete("/schedules/:scheduleId", authMiddleware, deleteSchedule);

router.patch("/schedules/:scheduleId/toggle", authMiddleware, toggleSchedule);


export default router;
