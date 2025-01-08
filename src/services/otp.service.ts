import { Otp } from "../models";
import { logger } from "../utils"


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

export const verifyOtp = async (userId: string, otp: string): Promise<boolean> => {
    try {
        const otpExisted = await Otp.exists({ userId, otp });
        return otpExisted !== null;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}