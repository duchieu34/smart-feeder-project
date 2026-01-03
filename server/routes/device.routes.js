import { Router } from "express";
import { getDevices, createDevice, feedNowController, getDeviceStats} from "../controllers/device.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.get("/", getDevices);
router.post("/", createDevice);
router.post("/feed-now/:deviceId", authMiddleware, feedNowController);
router.get("/stats/:deviceId", authMiddleware, getDeviceStats);

export default router;
