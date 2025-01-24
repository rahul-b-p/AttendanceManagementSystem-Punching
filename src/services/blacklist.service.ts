import { IBlackList, TokenPayload } from "../interfaces";
import { Blacklist } from "../models";
import { logger } from "../utils";
import jwt from 'jsonwebtoken';


/**
 * Checks the given token is blacklisted or not
 */

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
    try {
        const existOnBlacklist = await Blacklist.exists({ token });
        return existOnBlacklist !== null;
    } catch (error) {
        logger.error(error);
        throw new Error("Can't check the token now");
    }
}

/**
 * Black list the given token until its expiration time
 */
export const blacklistToken = async (token: string): Promise<IBlackList> => {
    try {
        const { exp } = jwt.decode(token) as TokenPayload;
        const expireAt = new Date(exp * 1000);
        const blacklistedToken = new Blacklist({ token, expireAt });
        await blacklistedToken.save();
        return blacklistedToken;
    } catch (error) {
        logger.error(error);
        throw new Error("Can't check the token now");
    }
}