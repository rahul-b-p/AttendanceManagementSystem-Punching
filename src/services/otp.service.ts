import { Otp } from "../models";
import { logger } from "../utils"



/**
 * Generates an OTP for the given user and saves it in the database with a 5-minute expiration time.
 */
export const generateOtp = async (userId: string): Promise<string> => {
    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const newOtp = new Otp({
            otp,
            userId
        });

        await newOtp.save();
        return otp;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}


/**
 * Generates an OTP for the given user and saves it in the database with a 5-minute expiration time.
 */
export const verifyOtp = async (userId: string, otp: string): Promise<boolean> => {
    try {
        const otpExisted = await Otp.exists({ userId, otp });
        if (otpExisted) {
            await Otp.findByIdAndDelete(otpExisted._id);
        }
        return otpExisted !== null;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}