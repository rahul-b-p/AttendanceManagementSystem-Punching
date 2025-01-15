import { NextFunction, Request, Response } from "express";
import { hashPassword, logger } from "../utils";
import { AuthenticationError, InternalServerError, NotFoundError } from "../errors";
import { comparePassword, sendCustomResponse } from "../utils";
import { signAccessToken, signRefreshToken } from "../jwt";
import { UserAuthBody, UserLoginOtpReq, UserPasswordResetReq, UserUpdateArgs } from "../types";
import { blacklistToken, findUserByEmail, findUserById, getUserData, sendOtpForInitialLogin, sendOtpForPasswordReset, updateUserById, verifyOtp } from "../services";
import { customRequestWithPayload } from "../interfaces";





export const login = async (req: Request<{}, any, UserAuthBody>, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const existingUser = await findUserByEmail(email);
        if (!existingUser) return next(new NotFoundError('User not found with given email id'));



        if (!existingUser.verified || !existingUser.password) {

            const sendMailInfo = await sendOtpForInitialLogin(existingUser._id.toString(), existingUser.email);
            logger.info(sendMailInfo);
            if (sendMailInfo.accepted.length <= 0) throw new Error('Email Validation failed while creating user');

            res.status(200).json({
                "message": "OTP sent for first-time login verification.",
                "emailSent": true
            });
            return;
        }

        const isVerifiedPassword = await comparePassword(password, existingUser.password);
        if (!isVerifiedPassword) return next(new AuthenticationError('Invalid Password'));

        const AccessToken = await signAccessToken(existingUser._id.toString(), existingUser.role);
        const RefreshToken = await signRefreshToken(existingUser._id.toString(), existingUser.role);

        const updateRefreshToken = { $set: { refreshToken: RefreshToken } };
        await updateUserById(existingUser._id.toString(), updateRefreshToken);

        const UserData = await getUserData(existingUser._id.toString());

        res.statusMessage = "Login Successful";
        res.status(200).json({ ...await sendCustomResponse('Login Successful', UserData), AccessToken, RefreshToken });
    } catch (error) {
        logger.error(error);
        next(new InternalServerError())
    }
}

export const refresh = async (req: customRequestWithPayload, res: Response, next: NextFunction) => {
    try {
        const id = req.payload?.id;
        if (!id) throw new Error('The user ID was not added to the payload by the authentication middleware.');

        const existingUser = await findUserById(id);
        if (!existingUser) throw new Error('Authorization Failed');

        const AccessToken = await signAccessToken(existingUser._id.toString(), existingUser.role);
        const RefreshToken = await signRefreshToken(existingUser._id.toString(), existingUser.role);

        const updateRefreshToken = { $set: { refreshToken: RefreshToken } };
        await updateUserById(existingUser._id.toString(), updateRefreshToken);

        res.status(200).json(await sendCustomResponse('Token refreshed successfully', { AccessToken, RefreshToken }));
    } catch (error) {
        logger.error(error);
        next(new InternalServerError('Something went wrong'));
    }
}

export const logout = async (req: customRequestWithPayload, res: Response, next: NextFunction) => {
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

        res.status(200).json(await sendCustomResponse('Logged out successfully.'));
    } catch (error) {
        logger.error(error);
        next(new InternalServerError('Something went wrong'));
    }
}

export const firstLoginOtpValidation = async (req: Request<{}, any, UserLoginOtpReq>, res: Response, next: NextFunction) => {
    try {
        const { otp, email } = req.body;

        const existingUser = await findUserByEmail(email);
        if (!existingUser) return next(new NotFoundError('User not found with given email id'));

        const isValidOtp = await verifyOtp(existingUser._id.toString(), otp);
        if (!isValidOtp) return next(new AuthenticationError("Invalid Otp"));


        const AccessToken = await signAccessToken(existingUser._id.toString(), existingUser.role);
        const RefreshToken = await signRefreshToken(existingUser._id.toString(), existingUser.role);

        const updateRefreshToken: UserUpdateArgs = { $set: { refreshToken: RefreshToken, verified: false } };
        await updateUserById(existingUser._id.toString(), updateRefreshToken);

        const UserData = await getUserData(existingUser._id.toString());

        res.statusMessage = "Login Successful";
        res.status(200).json({ ...await sendCustomResponse('Login Successful', UserData), AccessToken, RefreshToken });

    } catch (error: any) {
        logger.error(error);
        next(new InternalServerError('Something went wrong'));
    }
}

export const forgotPassword = async (req: Request<{}, any, { email: string }>, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;

        const existingUser = await findUserByEmail(email);
        if (!existingUser) return next(new NotFoundError('User not found with given email id'));

        const sendMailInfo = await sendOtpForPasswordReset(existingUser._id.toString(), existingUser.email);
        logger.info(sendMailInfo);
        if (sendMailInfo.accepted.length <= 0) throw new Error('Email Validation failed while creating user');

        res.status(200).json({
            "message": "OTP sent for reset password.",
            "emailSent": true
        });
    } catch (error) {
        logger.error(error);
        next
    }
}

export const resetPassword = async (req: Request<{}, any, UserPasswordResetReq>, res: Response, next: NextFunction) => {
    try {
        const { otp, email, password } = req.body;

        const existingUser = await findUserByEmail(email);
        if (!existingUser) return next(new NotFoundError('User not found with given email id'));

        const isValidOtp = await verifyOtp(existingUser._id.toString(), otp);
        if (!isValidOtp) return next(new AuthenticationError("Invalid Otp"));


        const hashedPass = await hashPassword(password);
        const updateBody: UserUpdateArgs = { $set: { password: hashedPass } };

        const updatedUser = await updateUserById(existingUser._id.toString(), updateBody);
        res.status(200).json(await sendCustomResponse('Password updated successfully'));
    } catch (error: any) {
        logger.error(error);
        next(new InternalServerError('Something went wrong'));
    }
}
