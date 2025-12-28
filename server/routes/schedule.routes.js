import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createSchedule, getSchedules, updateSchedule, deleteSchedule, toggleSchedule } from "../controllers/schedule.controller.js";

const router = Router();

router.post("/devices/:deviceId", authMiddleware, createSchedule);

router.get("/devices/:deviceId", authMiddleware, getSchedules);

router.put("/:scheduleId", authMiddleware, updateSchedule);

router.delete("/:scheduleId", authMiddleware, deleteSchedule);

router.patch("/:scheduleId/toggle", authMiddleware, toggleSchedule);


export default router;
