import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import sendMail from "../utils/sendMail.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// SIGN UP
export const signUp = async (req, res) => {
    try {
        const { fullname, email, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Mật khẩu xác nhận không trùng khớp" });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: "Email đã tồn tại" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const activationToken = crypto.randomBytes(32).toString("hex");

        const user = await prisma.user.create({
            data: {
                fullname,
                email,
                passwordHash,
                activationToken,
                isActive: false,
            }
        });

        const activationLink = `${process.env.FRONTEND_URL}/activate/${activationToken}`;

        await sendMail(
            email,
            "Kích hoạt tài khoản của bạn",
            `
            Xin chào ${fullname},
            Vui lòng bấm vào liên kết sau để kích hoạt tài khoản của bạn:
            ${activationLink}

            Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.
            `
        );

        res.json({
            message: "Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản",
            user: { id: user.id, email: user.email }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Lỗi hệ thống khi đăng ký" });
    }
};


// ACTIVATE ACCOUNT
export const activateAccount = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await prisma.user.findFirst({
            where: { activationToken: token }
        });

        if (!user) return res.status(400).json({ error: "Token kích hoạt không hợp lệ" });

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isActive: true,
                activationToken: null
            }
        });

        res.json({ message: "Kích hoạt tài khoản thành công!" });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Lỗi hệ thống" });
    }
};


// LOGIN
export const logIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: "Email không tồn tại" });

        if (!user.isActive) {
            return res.status(403).json({
                error: "Tài khoản chưa kích hoạt. Vui lòng kiểm tra email"
            });
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return res.status(400).json({ error: "Sai mật khẩu" });

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        // (Optional) Lưu token trong DB
        await prisma.user.update({
            where: { id: user.id },
            data: { token }
        });

        res.json({
            message: "Đăng nhập thành công",
            token,
            user: { id: user.id, fullname: user.fullname, email: user.email }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Lỗi đăng nhập" });
    }
};

// GET PROFILE
export const getProfile = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Token không hợp lệ" });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                fullname: true,
                email: true,
                isActive: true
            }
        });

        if (!user) return res.status(404).json({ error: "Không tìm thấy user" });

        res.json({ success: true, user });

    } catch (err) {
        console.error(err);
        res.status(401).json({ error: "Token không hợp lệ hoặc hết hạn" });
    }
};
