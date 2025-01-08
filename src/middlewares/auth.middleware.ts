import { NextFunction, Response } from "express";
import { AuthenticationError } from "../errors";
import { logger } from "../utils";
import { customRequestWithPayload, TokenPayload } from "../interfaces";
import { isValidObjectId } from "../validators";
import { verifyAccessToken, verifyRefreshToken } from "../jwt";
import { checkRefreshTokenExistsById, isTokenBlacklisted } from "../services";



export const accessTokenAuth = async (req: customRequestWithPayload, res: Response, next: NextFunction) => {
    try {
        const AccessToken = req.headers.authorization?.split(' ')[1];
        if (!AccessToken) return next(new AuthenticationError());

        const isBlacklisted = await isTokenBlacklisted(AccessToken);
        if (isBlacklisted) return next(new AuthenticationError());

        const tokenPayload = await verifyAccessToken(AccessToken);
        if (!tokenPayload || !isValidObjectId(tokenPayload.id)) return next(new AuthenticationError());

        req.payload = { id: tokenPayload.id };
        next();
    } catch (error: any) {
        logger.error(error);
        next(new AuthenticationError());
    }
};

export const refreshTokenAuth = async (req: customRequestWithPayload, res: Response, next: NextFunction) => {
    try {
        const RefreshToken = req.headers.authorization?.split(' ')[1];
        if (!RefreshToken) return next(new AuthenticationError());

        const isJwtBlacklisted = await isTokenBlacklisted(RefreshToken);
        if (isJwtBlacklisted) return next(new AuthenticationError());

        const tokenPayload = await verifyAccessToken(RefreshToken);
        if (!tokenPayload || !isValidObjectId(tokenPayload.id)) return next(new AuthenticationError());

        const isRefreshTokenExists = await checkRefreshTokenExistsById(tokenPayload.id, RefreshToken);
        if (!isRefreshTokenExists) return next(new AuthenticationError());

        req.payload = { id: tokenPayload.id };
        next();
    } catch (error: any) {
        logger.error(error);
        next(new AuthenticationError());
    }
};