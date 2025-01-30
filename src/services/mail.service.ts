import { SentMessageInfo } from "nodemailer";
import { HOST_EMAIL_ID, transporter } from "../config"
import { EmailOptions, IUserData } from "../types";
import { logFunctionInfo, logger } from "../utils"
import { generateOtp } from "./otp.service";
import { FunctionStatus } from "../enums";
import { errorMessage, getOtpMessage, getOtpMessageHTML, getUserCreationNotification, getUserCreationNotificationHTML, getUserUpdationNotification, getUserUpdationNotificationHTML } from "../constants";



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

    const functionName = 'sendOtpForInitialLogin';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const otp = await generateOtp(userId);
        const emailOptions: EmailOptions = {
            to: email,
            subject: 'Your Email Verification OTP',
            text: getOtpMessage(otp),
            html: getOtpMessageHTML(otp)
        };

        const mailInfo = await sendEmail(emailOptions);

        logFunctionInfo(functionName, FunctionStatus.success);
        return mailInfo;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(errorMessage.FAILED_TO_SEND_OTP_EMAIL);
    }
};


/**
 * Generates an OTP for password reset and sends it to the specified recipient's email address.
 */
export const sendOtpForPasswordReset = async (userId: string, email: string): Promise<SentMessageInfo> => {
    const functionName = 'sendOtpForPasswordReset';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const otp = await generateOtp(userId);
        const emailOptions: EmailOptions = {
            to: email,
            subject: 'Password Reset Request',
            text: getOtpMessage(otp),
            html: getOtpMessageHTML(otp)
        };

        const mailInfo = await sendEmail(emailOptions);

        logFunctionInfo(functionName, FunctionStatus.success);
        return mailInfo;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(errorMessage.FAILED_TO_SEND_OTP_EMAIL);
    }
};


/**
 * Sends an account creation acknowledgment notification to the recipient's email address.
 */
export const sendUserCreationNotification = async (user: IUserData): Promise<SentMessageInfo> => {
    const functionName = '';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const { role, email, username, phone } = user;

        const emailOptions: EmailOptions = {
            to: email,
            subject: `Welcome to [Your Company Name] - Account Created`,
            text: getUserCreationNotification(username, role, email, phone),
            html: getUserCreationNotificationHTML(username, role, email, phone)
        }

        const mailOPtions = await sendEmail(emailOptions);
        logFunctionInfo(functionName, FunctionStatus.success);
        return mailOPtions;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 * Sends an account updation acknowledgment notification to the recipient's email address.
 */
export const sendUserUpdationNotification = async (to: string, updatedUser: IUserData, existingEmail: string,): Promise<SentMessageInfo> => {
    const functionName = 'sendUserUpdationNotification';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const emailOptions: EmailOptions = {
            to,
            subject: "Your Account email has been edited",
            html: getUserUpdationNotificationHTML(updatedUser.username, existingEmail, updatedUser.email),
            text: getUserUpdationNotification(updatedUser.username, existingEmail, updatedUser.email)
        }

        const mailOPtions = await sendEmail(emailOptions);

        logFunctionInfo(functionName, FunctionStatus.success);
        return mailOPtions;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}