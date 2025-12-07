import { Router } from "express";
import { signUp, logIn, getProfile, activateAccount } from "../controllers/user.controller.js";
import { auth } from "../middlewares/auth.js";

const router = Router();

router.post("/sign-up", signUp);
router.post("/log-in", logIn);
router.get("/profile", auth, getProfile);
router.get("/activate/:token", activateAccount);

export default router;