import { NextFunction, Response } from "express";
import { AuthenticationError, ForbiddenError, InternalServerError } from "../errors";
import { getPermissionSetFromDefaultRoles, getActionFromMethod, logFunctionInfo } from "../utils";
import { customRequestWithPayload } from "../interfaces";
import { isValidObjectId, permissionValidator } from "../validators";
import { verifyAccessToken, verifyRefreshToken } from "../jwt";
import { blacklistToken, checkRefreshTokenExistsById, findUserById, isTokenBlacklisted } from "../services";
import { FunctionStatus, Roles } from "../enums";
import { errorMessage } from "../constants";



/**
 * Middleware function to Authorize Access Token by JWT
*/
export const accessTokenAuth = async (req: customRequestWithPayload, res: Response, next: NextFunction) => {
    const functionName = 'accessTokenAuth';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const AccessToken = req.headers.authorization?.split(' ')[1];
        if (!AccessToken) throw new AuthenticationError();

        const isBlacklisted = await isTokenBlacklisted(AccessToken);
        if (isBlacklisted) throw new AuthenticationError();

        const tokenPayload = await verifyAccessToken(AccessToken);
        if (!tokenPayload || !isValidObjectId(tokenPayload.id)) throw new AuthenticationError();

        req.payload = { id: tokenPayload.id };

        logFunctionInfo(functionName, FunctionStatus.success);
        next();
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail);
        next(error);
    }
};

/**
 * Middleware function to Authorize Access Token by JWT
*/
export const refreshTokenAuth = async (req: customRequestWithPayload, res: Response, next: NextFunction) => {
    const functionName = 'refreshTokenAuth';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const RefreshToken = req.headers.authorization?.split(' ')[1];
        if (!RefreshToken) throw new AuthenticationError();

        const isJwtBlacklisted = await isTokenBlacklisted(RefreshToken);
        if (isJwtBlacklisted) throw new AuthenticationError();

        const tokenPayload = await verifyRefreshToken(RefreshToken);
        if (!tokenPayload || !isValidObjectId(tokenPayload.id)) return next(new AuthenticationError());
        const isRefreshTokenExists = await checkRefreshTokenExistsById(tokenPayload.id, RefreshToken);
        if (!isRefreshTokenExists) throw new AuthenticationError();

        await blacklistToken(RefreshToken);
        req.payload = { id: tokenPayload.id };

        logFunctionInfo(functionName, FunctionStatus.success);
        next();
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
};


/**
 * Middleware function to Authorize user Role
 * @param {Roles} -user role
*/
export const roleAuth = (...allowedRole: Roles[]) => {
    const functionName = 'roleAuth';

    return async (req: customRequestWithPayload, res: Response, next: NextFunction) => {
        logFunctionInfo(functionName, FunctionStatus.start);
        try {
            const id = req.payload?.id;
            if (!id) throw new InternalServerError(errorMessage.NO_USER_ID_IN_PAYLOAD);

            const existingUser = await findUserById(id);
            if (!existingUser) throw new AuthenticationError()

            const { role } = existingUser;
            if (!Object.values(Roles).includes(role as Roles)) {
                const permissionset = getPermissionSetFromDefaultRoles(...allowedRole);
                const requiredAction = getActionFromMethod(req.method);
                const isPermitted = await permissionValidator(permissionset, role, requiredAction);
                if (!isPermitted) throw new ForbiddenError(errorMessage.INSUFFICIENT_PRIVILEGES);
            }
            else if (!allowedRole.includes(role as Roles)) throw new ForbiddenError(errorMessage.INSUFFICIENT_PRIVILEGES);

            next();
        } catch (error: any) {
            logFunctionInfo(functionName, FunctionStatus.fail, error.message);
            next(error);
        }
    }
}