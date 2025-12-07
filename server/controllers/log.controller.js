import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import sendMail from "../utils/sendMail.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const signUp = async (req, res) => {
    try {
        const { fullname, email, password, confirmPassword } = req.body;

        if (password !== confirmPassword) return res.status(400).json({ error: "Signup failed" });

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: "Email existed" });

        const salt = await bcrypt.genSalt(10);

        const passwordHash = await bcrypt.hash(password, salt);

        const activationToken = crypto.randomBytes(32).toString("hex");

        const user = await prisma.user.create({
            data: {
                fullname, email, passwordHash, activationToken, isActive: false
            }
        });

        const activationLink = `${process.env.FRONTEND_URL}/activate/${activationToken}`;
        await sendMail(
            email,
            "Kích hoạt tài khoản của bạn trên nền tảng Quản lý bữa ăn cho thú cưng",
            `Xin chào ${fullname}, \n\nVui lòng bấm vào liên kết sau để kích hoạt tài khoản của bạn: \n${activationLink}\n\nCảm ơn bạn đã sử dụng dịch vụ của chúng tôi.`
        );

        res.json({ message: "Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản của bạn", user });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Không thể đăng ký tài khoản do lỗi hệ thống" });
    }
}

export const activateAccount = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await prisma.user.findFirst({ where: { activationToken: token } });
        if (!user) return res.status(400).json({ error: "Token không hợp lệ" });

        await prisma.user.update({
            where: { id: user.id },
            data: { isActive: true, activationToken: null }
        });

        res.json({ message: "Tài khoản đã được kích hoạt thành công!" });
    } catch (e) {
        res.status(500).json({ error: e });
    }
}

export const logIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("Login info: ", email, password);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: "Tài khoản không tồn tại" });

        if (!user.isActive) return res.status(403).json({ error: "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt tài khoản" });

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return res.status(400).json({ error: "Sai mật khẩu" });

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET,
            { expiresIn: "24h", }
        );

        await prisma.user.update({ where: { id: user.id }, data: { token } });

        res.json({ message: "Đăng nhập thành công", token });
    } catch (e) {
        res.status(500).json({ error: e });
    }
}

export const getProfile = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Thiếu token" });
        }

        const token = authHeader.split(" ")[1];

        // console.log("token: ", token);

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

        if (!user) {
            return res.status(401).json({ error: "User not existed" });
        }

        console.log("User profile: ", user)

        res.json({ success: true, user });
    } catch (err) {
        console.error(err);
        res.status(401).json({ error: "Invalid or expired token" });
    }
}

// export const forgetPassword = async (req, res) => {
//     try {
//         const {email} = req.body;

//         const user = await prisma.user.findFirst({
//             where: {email: email}
//         });

//         if(!user) res.status(404).json({error: "Cannot find user!"});

//         const activationToken = crypto.randomBytes(32).toString('hex');

//         const activationLink = `${process.env.FRONTEND_URL}/activate/${activationToken}`;
//         await sendMail(
//             email,
//             "Kích hoạt tài khoản của bạn trên nền tảng Chatbot đặt lịch khám bệnh",
//             `Xin chào ${fullname}, \n\nVui lòng bấm vào liên kết sau để kích hoạt tài khoản của bạn: \n${activationLink}\n\nCảm ơn bạn đã sử dụng dịch vụ của chúng tôi.`
//         );
//     } catch (e) {
//         res.status(500).json({error: e.message});
//     }
// }
