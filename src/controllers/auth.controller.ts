import { NextFunction, Request, Response } from "express";
import { logger } from "../utils";
import { AuthenticationError, InternalServerError, NotFoundError } from "../errors";
import { comparePassword, sendCustomResponse } from "../utils";
import { signAccessToken, signRefreshToken } from "../jwt";
import { UserAuthBody } from "../types";
import { findUserByEmail, findUserById, updateUserById } from "../services";
import { customRequestWithPayload } from "../interfaces";





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


export const refresh = async (req: customRequestWithPayload, res: Response, next: NextFunction) => {
    try {
        const id = req.payload?.id;
        if (!id) throw new Error('The user ID was not added to the payload by the authentication middleware.');

        const existingUser = await findUserById(id);
        if (!existingUser) throw new Error('Authorization Failed');

        const AccessToken = await signAccessToken(existingUser._id.toString(), existingUser.role);
        const RefreshToken = await signRefreshToken(existingUser._id.toString(), existingUser.role);

        await updateUserById(existingUser._id.toString(), { refreshToken: RefreshToken });

        res.status(200).json(await sendCustomResponse('Token refreshed successfully', { AccessToken, RefreshToken }));
    } catch (error) {
        logger.error(error);
        next(new InternalServerError('Something went wrong'));
    }
}
