import { Router } from "express";
import { signUp, logIn, activateAccount } from "../controllers/user.controller.js";

const router = Router();

router.post("/signup", signUp);
router.post("/login", logIn);
router.get("/activate/:token", activateAccount);

export default router;