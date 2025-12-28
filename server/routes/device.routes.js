import { Router } from "express";
import { getDevices, createDevice, feedNowController } from "../controllers/device.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.get("/", getDevices);
router.post("/", createDevice);
router.post("/feed-now/:deviceId", authMiddleware, feedNowController);

export default router;
