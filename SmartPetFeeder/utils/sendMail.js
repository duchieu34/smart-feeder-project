import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export default async function sendMail(to, subject, text) {
    await transporter.sendMail({
        from: `"Healthcare Chatbot" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
    });
}