import { SentMessageInfo } from "nodemailer";
import { HOST_EMAIL_ID, transporter } from "../config"
import { EmailOptions, IUserData } from "../types";
import { logger } from "../utils"
import { generateOtp } from "./otp.service";



/**
 * Sends an email from the application's host address to the specified recipient with the provided message content.
 */
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


/**
 * Generates an OTP for initial login or account verification and sends it to the specified recipient's email address.
 */
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


/**
 * Generates an OTP for password reset and sends it to the specified recipient's email address.
 */
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


/**
 * Sends an account creation acknowledgment notification to the recipient's email address.
 */
export const sendUserCreationNotification = async (user: IUserData): Promise<SentMessageInfo> => {
    try {
        const { role, email, username, phone } = user;

        const emailContent = `
    <b>Hi ${username},</b>

    <p>Welcome to [Your Company Name]!</p>

    <p>Your ${role} account has been successfully created in our Attendance Management System. Here are your account details:<p>
    <ul>
    <li>Email: ${email}</li>
    <li>Phone: ${phone}</li>
    </ul>

    <p>To activate your account, please verify your email and set your password using the link below:</p>

    <a>(link)</a>

    <p>Once you’ve completed the verification, you’ll have full access to the system. If you need any assistance, don’t hesitate to contact our support team.</p>

    <p>We’re excited to have you with us. Welcome aboard!<p>

    <p>Best regards,<p>
    <p><b>[Your Company Name]</b></p>
    <p><b>[Support Contact Information]</b></p>
  `;

        const emailOptions: EmailOptions = {
            to: email,
            subject: `Welcome to [Your Company Name] - Account Created`,
            text: emailContent,
            html: emailContent
        }

        return await sendEmail(emailOptions);

    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}


/**
 * Sends an account updation acknowledgment notification to the recipient's email address.
 */
export const sendUserUpdationNotification = async (to: string, updatedUser: IUserData, existingEmail?: string,): Promise<SentMessageInfo> => {
    try {
        const emailContent = `
    <b>Hi ${updatedUser.username},</b>

    <p>Your Email has been changed from ${existingEmail} to ${updatedUser.email}!</p>
    <p>Please verify your account by following link</p>
    <a href"">link</a>
    <p>Once you’ve completed the verification, you’ll have full access to the system. If you need any assistance, don’t hesitate to contact our support team.</p>

    <p>We’re excited to have you with us. Welcome aboard!<p>

    <p>Best regards,<p>
    <p><b>[Your Company Name]</b></p>
    <p><b>[Support Contact Information]</b></p>
    `

        const emailOptions: EmailOptions = {
            to,
            subject: "Your Account email has been edited",
            html: emailContent,
            text: emailContent
        }

        return await sendEmail(emailOptions);
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}