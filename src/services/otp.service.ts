import { FunctionStatus } from "../enums";
import { Otp } from "../models";
import { logFunctionInfo } from "../utils"



/**
 * Generates an OTP for the given user and saves it in the database with a 5-minute expiration time.
 */
export const generateOtp = async (userId: string): Promise<string> => {
    const functionName = 'generateOtp';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const newOtp = new Otp({
            otp,
            userId
        });

        await newOtp.save();

        logFunctionInfo(functionName, FunctionStatus.success);
        return otp;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 * Generates an OTP for the given user and saves it in the database with a 5-minute expiration time.
 */
export const verifyOtp = async (userId: string, otp: string): Promise<boolean> => {
    const functionName = 'verifyOtp';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const otpExisted = await Otp.exists({ userId, otp });
        if (otpExisted) {
            await Otp.findByIdAndDelete(otpExisted._id);
        }

        logFunctionInfo(functionName, FunctionStatus.success);
        return otpExisted !== null;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.success);
        throw new Error(error.message);
    }
}