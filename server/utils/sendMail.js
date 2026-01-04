// // server/utils/sendMail.js

// const sendMail = async (to, subject, text) => {
//     // Thay vì gửi mail thật (phức tạp), ta in ra màn hình để test
//     console.log("========================================");
//     console.log("📧 [MOCK EMAIL] Đang gửi email tới:", to);
//     console.log("📝 Tiêu đề:", subject);
//     console.log("📄 Nội dung:");
//     console.log(text);
//     console.log("========================================");

//     // Giả vờ đợi 1 chút cho giống thật
//     await new Promise(resolve => setTimeout(resolve, 500));

//     return true;
// };

// export default sendMail;

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
        from: `"Smart Pet Feeder" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
    });
}
