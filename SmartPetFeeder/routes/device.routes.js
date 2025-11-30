import { Router } from "express";
import { getDevices, createDevice, feedNowController } from "../controllers/device.controller.js";

const router = Router();

router.get("/", getDevices);
router.post("/", createDevice);
router.post("/feed-now/:deviceId", feedNowController);

export default router;
