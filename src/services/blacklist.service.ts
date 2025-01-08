import { Blacklist } from "../models";
import { logger } from "../utils";




export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
    try {
        const existOnBlacklist = await Blacklist.exists({ token });
        return existOnBlacklist !== null;
    } catch (error) {
        logger.error(error);
        throw new Error("Can't check the token now");
    }
}
