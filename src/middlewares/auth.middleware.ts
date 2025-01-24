import { NextFunction, Response } from "express";
import { AuthenticationError, ForbiddenError, InternalServerError } from "../errors";
import { logger, getPermissionSetFromDefaultRoles, getActionFromMethod } from "../utils";
import { customRequestWithPayload } from "../interfaces";
import { isValidObjectId, permissionValidator } from "../validators";
import { verifyAccessToken, verifyRefreshToken } from "../jwt";
import { blacklistToken, checkRefreshTokenExistsById, findUserById, isTokenBlacklisted } from "../services";
import { Roles } from "../enums";



/**
 * Middleware function to Authorize Access Token by JWT
*/
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

/**
 * Middleware function to Authorize Access Token by JWT
*/
export const refreshTokenAuth = async (req: customRequestWithPayload, res: Response, next: NextFunction) => {
    try {
        const RefreshToken = req.headers.authorization?.split(' ')[1];
        if (!RefreshToken) return next(new AuthenticationError());

        const isJwtBlacklisted = await isTokenBlacklisted(RefreshToken);
        if (isJwtBlacklisted) return next(new AuthenticationError());

        const tokenPayload = await verifyRefreshToken(RefreshToken);
        if (!tokenPayload || !isValidObjectId(tokenPayload.id)) return next(new AuthenticationError());

        const isRefreshTokenExists = await checkRefreshTokenExistsById(tokenPayload.id, RefreshToken);
        if (!isRefreshTokenExists) return next(new AuthenticationError());

        await blacklistToken(RefreshToken);
        req.payload = { id: tokenPayload.id };
        next();
    } catch (error: any) {
        logger.error(error);
        next(new AuthenticationError());
    }
};


/**
 * Middleware function to Authorize user Role
 * @param {Roles} -user role
*/
export const roleAuth = (...allowedRole: Roles[]) => {
    return async (req: customRequestWithPayload, res: Response, next: NextFunction) => {
        try {
            const id = req.payload?.id;
            if (!id) throw new Error('The user ID was not added to the payload by the authentication middleware.');

            const existingUser = await findUserById(id);
            if (!existingUser) throw new Error('Losses the UserId or User Data of an authorized Request! ')

            const { role } = existingUser;
            if (!Object.values(Roles).includes(role as Roles)) {
                const permissionset = getPermissionSetFromDefaultRoles(...allowedRole);
                const requiredAction = getActionFromMethod(req.method);
                const isPermitted = await permissionValidator(permissionset, role, requiredAction);
                if (!isPermitted) return next(new ForbiddenError('Forbidden: Insufficient role privileges'));
            }
            else if (!allowedRole.includes(role as Roles)) return next(new ForbiddenError('Forbidden: Insufficient role privileges'));

            next();
        } catch (error) {
            logger.error(error);
            next(new InternalServerError('Something went wrong'));
        }
    }
}