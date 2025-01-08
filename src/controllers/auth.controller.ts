import { NextFunction, Request, Response } from "express";
import { logger } from "../utils";
import { AuthenticationError, InternalServerError, NotFoundError } from "../errors";
import { comparePassword, sendCustomResponse } from "../utils";
import { signAccessToken, signRefreshToken } from "../jwt";
import { UserAuthBody } from "../types";
import { findUserByEmail, updateUserById } from "../services";





export const login = async (req: Request<{}, any, UserAuthBody>, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const existingUser = await findUserByEmail(email);
        if (!existingUser) return next(new NotFoundError('User not found with given email id'));

        const isVerifiedPassword = await comparePassword(password, existingUser.password);
        if (!isVerifiedPassword) return next(new AuthenticationError('Invalid Password'));

        const AccessToken = await signAccessToken(existingUser._id.toString(), existingUser.role);
        const RefreshToken = await signRefreshToken(existingUser._id.toString(), existingUser.role);

        await updateUserById(existingUser._id.toString(), { refreshToken: RefreshToken });

        res.statusMessage = "Login Successful";
        res.status(200).json(await sendCustomResponse('Login Successful', { AccessToken, RefreshToken }));
    } catch (error) {
        logger.error(error);
        next(new InternalServerError())
    }
}
