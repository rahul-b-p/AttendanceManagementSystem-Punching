import { FunctionStatus } from "../enums";
import { IBlackList, TokenPayload } from "../interfaces";
import { Blacklist } from "../models";
import { logFunctionInfo, logger } from "../utils";
import jwt from 'jsonwebtoken';


/**
 * Checks the given token is blacklisted or not
 */

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
    const functionName = 'isTokenBlacklisted';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const existOnBlacklist = await Blacklist.exists({ token });
        logFunctionInfo(functionName, FunctionStatus.success);
        return existOnBlacklist !== null;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error("Can't check the token now");
    }
}

/**
 * Black list the given token until its expiration time
 */
export const blacklistToken = async (token: string): Promise<IBlackList> => {
    const functionName = 'blacklistToken';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { exp } = jwt.decode(token) as TokenPayload;
        const expireAt = new Date(exp * 1000);
        const blacklistedToken = new Blacklist({ token, expireAt });
        await blacklistedToken.save();

        logFunctionInfo(functionName, FunctionStatus.start);
        return blacklistedToken;
    } catch (error) {
        logFunctionInfo(functionName, FunctionStatus.start);
        throw new Error("Can't check the token now");
    }
}