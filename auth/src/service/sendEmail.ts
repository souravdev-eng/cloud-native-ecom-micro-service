import { createTransport, SendMailOptions } from 'nodemailer'
import { config } from '../config';

export function generateResetToken() {
    return Math.random().toString(36).slice(2);
}

export const sendResetTokenEmail = async (receiverEmail: string, token: string) => {
    const transporter = createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: config.EMAIL_USER,
            pass: config.EMAIL_APP_PASSWORD,
        }
    })

    const mailOptions: SendMailOptions = {
        from: {
            name: "Ecom",
            address: config.EMAIL_USER!
        },
        to: `To ${receiverEmail}`,
        subject: "Password Reset",
        text: `Your password reset token is: ${token}`,
        html: `<b> Your password reset token is: ${token}</b>`
    }

    await transporter.sendMail(mailOptions);
    console.log("Email send success fully")
}