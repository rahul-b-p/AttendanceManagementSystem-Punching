import { SentMessageInfo } from "nodemailer";
import { HOST_EMAIL_ID, transporter } from "../config"
import { EmailOptions } from "../types";
import { logger } from "../utils"
import { generateOtp } from "./otp.service";




const sendEmail = async (emailOptions: EmailOptions): Promise<SentMessageInfo> => {
    try {
        return await transporter.sendMail({
            from: HOST_EMAIL_ID,
            ...emailOptions
        });
    } catch (error: any) {
        logger.error(error);
        throw new Error(`Node mailer Failed:${error.message}`);
    }
}

export const sendOtpForInitialLogin = async (userId: string, email: string): Promise<SentMessageInfo> => {
    try {
        const otp = await generateOtp(userId);
        const emailOptions: EmailOptions = {
            to: email,
            subject: 'Your First-Time Login OTP',
            text: `Your OTP code for first-time login is: ${otp}\n\nThis code will expire in 5 minutes.`,
            html: `<p>Your OTP code for first-time login is: <strong>${otp}</strong></p><p>This code will expire in 5 minutes.</p>`
        };

        return await sendEmail(emailOptions);
    } catch (error) {
        logger.error('Error sending OTP email:', error);
        throw new Error('Failed to send OTP email');
    }
};


export const sendOtpForPasswordReset = async (userId: string, email: string): Promise<SentMessageInfo> => {
    try {
        const otp = await generateOtp(userId);
        const emailOptions: EmailOptions = {
            to: email,
            subject: 'Password Reset Request',
            text: `Your OTP (One-Time Password) is: ${otp}. This OTP will expire in 5 minutes.`,
            html: `<p>Your OTP (One-Time Password) is: <strong>${otp}</strong>.</p>  <p>This OTP will expire in <strong>5 minutes</strong>.</p>`
        };

        return await sendEmail(emailOptions);
    } catch (error) {
        logger.error('Error sending OTP email:', error);
        throw new Error('Failed to send OTP email');
    }
};