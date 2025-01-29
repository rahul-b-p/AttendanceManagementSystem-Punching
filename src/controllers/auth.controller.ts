import { NextFunction, Request, Response } from "express";
import { hashPassword, logFunctionInfo, logger } from "../utils";
import { AuthenticationError, InternalServerError, NotFoundError } from "../errors";
import { comparePassword, sendCustomResponse } from "../utils";
import { signAccessToken, signRefreshToken } from "../jwt";
import { UserAuthBody, UserOtpVerifyBody, UserUpdateArgs } from "../types";
import { blacklistToken, findUserByEmail, getUserData, findUserById, sendOtpForInitialLogin, sendOtpForPasswordReset, updateUserById, verifyOtp } from "../services";
import { customRequestWithPayload } from "../interfaces";
import { FunctionStatus } from "../enums";



/**
 * Controller function to handle the user login request.
 * Send OTP to registered email, if the account not verified, usually on first time login
 */
export const login = async (req: Request<{}, any, UserAuthBody>, res: Response, next: NextFunction) => {
    const functionName = 'login';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { email, password } = req.body;

        const existingUser = await findUserByEmail(email);
        if (!existingUser) throw new NotFoundError('User not found with given email id');

        if (!existingUser.verified || !existingUser.password) {

            const sendMailInfo = await sendOtpForInitialLogin(existingUser._id.toString(), existingUser.email);
            logger.info(sendMailInfo);
            if (sendMailInfo.accepted.length <= 0) throw new Error('Email Validation failed while creating user');

            logFunctionInfo(functionName, FunctionStatus.pending, "OTP sent for first-time login verification.")
            res.status(200).json({
                "message": "OTP sent for first-time login verification.",
                "emailSent": true
            });
            return;
        }

        const isVerifiedPassword = await comparePassword(password, existingUser.password);
        if (!isVerifiedPassword) throw new AuthenticationError('Invalid Password');

        const AccessToken = await signAccessToken(existingUser._id.toString(), existingUser.role);
        const RefreshToken = await signRefreshToken(existingUser._id.toString(), existingUser.role);

        const updateRefreshToken = { $set: { refreshToken: RefreshToken } };
        await updateUserById(existingUser._id.toString(), updateRefreshToken);

        const UserData = await getUserData(existingUser._id.toString());

        logFunctionInfo(functionName, FunctionStatus.success);
        res.statusMessage = "Login Successful";
        res.status(200).json({ ...await sendCustomResponse('Login Successful', UserData), AccessToken, RefreshToken });
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error)
    }
}


/**
 * Controller function to handle the token refresh request.
 */
export const refresh = async (req: customRequestWithPayload, res: Response, next: NextFunction) => {
    const functionName = 'refresh';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const id = req.payload?.id;
        if (!id) throw new Error('The user ID was not added to the payload by the authentication middleware.');

        const existingUser = await findUserById(id);
        if (!existingUser) throw new Error('Authorization Failed');

        const AccessToken = await signAccessToken(existingUser._id.toString(), existingUser.role);
        const RefreshToken = await signRefreshToken(existingUser._id.toString(), existingUser.role);

        const updateRefreshToken = { $set: { refreshToken: RefreshToken } };
        await updateUserById(existingUser._id.toString(), updateRefreshToken);

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse('Token refreshed successfully', { AccessToken, RefreshToken }));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(new InternalServerError('Something went wrong'));
    }
}


/**
 * Controller function to handle the user logout request.
 */
export const logout = async (req: customRequestWithPayload, res: Response, next: NextFunction) => {
    const functionName = 'logout'
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const id = req.payload?.id;
        if (!id) throw new Error('The user ID was not added to the payload by the authentication middleware.');

        const AccessToken = req.headers.authorization?.split(' ')[1];
        if (!AccessToken) throw new Error('AccessToken missed from header after auth middleware');

        const existingUser = await findUserById(id);
        if (!existingUser) return next(new NotFoundError());

        await blacklistToken(AccessToken);
        if (existingUser.refreshToken) {
            await blacklistToken(existingUser.refreshToken);
            await updateUserById(existingUser._id.toString(), { $unset: { refreshToken: 1 } });
        }

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse('Logged out successfully.'));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(new InternalServerError('Something went wrong'));
    }
}


/**
 * Controller function to handle verify the first time login by otp validation.
 * Saving new password to the user
 */
export const firstLoginOtpValidation = async (req: Request<{}, any, UserOtpVerifyBody>, res: Response, next: NextFunction) => {
    const functionName = 'firstLoginOtpValidation';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const { otp, email, confirmPassword } = req.body;

        const existingUser = await findUserByEmail(email);
        if (!existingUser) throw new NotFoundError('User not found withgiven email id');

        const isValidOtp = await verifyOtp(existingUser._id.toString(), otp);
        if (!isValidOtp) throw new AuthenticationError("Invalid Otp");


        const AccessToken = await signAccessToken(existingUser._id.toString(), existingUser.role);
        const RefreshToken = await signRefreshToken(existingUser._id.toString(), existingUser.role);

        const password = await hashPassword(confirmPassword);
        const updateRefreshToken: UserUpdateArgs = { $set: { refreshToken: RefreshToken, verified: true, password } };
        await updateUserById(existingUser._id.toString(), updateRefreshToken);

        const UserData = await getUserData(existingUser._id.toString());

        logFunctionInfo(functionName, FunctionStatus.success);
        res.statusMessage = "Login Successful";
        res.status(200).json({ ...await sendCustomResponse('Login Successful', UserData), AccessToken, RefreshToken });

    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}


/**
 * Controller function to handle the user forgot password request, and generates OTP.
 * The resetPassword feature should be used to complete the password reset process.
 */
export const forgotPassword = async (req: Request<{}, any, { email: string }>, res: Response, next: NextFunction) => {
    const functionName = 'forgotPassword';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { email } = req.body;

        const existingUser = await findUserByEmail(email);
        if (!existingUser) throw new NotFoundError('User not found with given email id');

        const sendMailInfo = await sendOtpForPasswordReset(existingUser._id.toString(), existingUser.email);
        logger.info(sendMailInfo);
        if (sendMailInfo.accepted.length <= 0) throw new Error('Email Validation failed while creating user');

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json({
            "message": "OTP sent for reset password.",
            "emailSent": true
        });
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}


/**
 * Controller function to reset the user password by OTP validation
 * The forgotPassword function should be used to generate and send the OTP to the user.
 */
export const resetPassword = async (req: Request<{}, any, UserOtpVerifyBody>, res: Response, next: NextFunction) => {
    const functionName = 'resetPassword';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const { otp, email, confirmPassword } = req.body;

        const existingUser = await findUserByEmail(email);
        if (!existingUser) throw new NotFoundError('User not found with given email id');

        const isValidOtp = await verifyOtp(existingUser._id.toString(), otp);
        if (!isValidOtp) throw new AuthenticationError("Invalid Otp");


        const password = await hashPassword(confirmPassword);
        const updateBody: UserUpdateArgs = { $set: { password: password } };

        const updatedUser = await updateUserById(existingUser._id.toString(), updateBody);

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse('Password updated successfully'));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}
