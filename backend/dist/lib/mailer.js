import "dotenv/config";
import nodemailer from "nodemailer";
const hasSmtpConfig = Boolean(process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS);
const transporter = hasSmtpConfig
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    })
    : nodemailer.createTransport({
        streamTransport: true,
        newline: "unix",
        buffer: true,
    });
export const sendVerificationEmail = async (to, verificationUrl) => {
    const mail = await transporter.sendMail({
        from: process.env.MAIL_FROM ?? "no-reply@oce.local",
        to,
        subject: "Verifikasi Email Akun Online Code Editor",
        text: `Klik tautan berikut untuk verifikasi email Anda: ${verificationUrl}`,
        html: `<p>Klik tautan berikut untuk verifikasi email Anda:</p><p><a href=\"${verificationUrl}\">${verificationUrl}</a></p>`,
    });
    if (!hasSmtpConfig && "message" in mail) {
        console.log("[MAIL PREVIEW] Verification email generated:");
        console.log(String(mail.message));
    }
};
