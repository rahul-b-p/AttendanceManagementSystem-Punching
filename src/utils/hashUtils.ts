import bcrypt from 'bcrypt';
import { HASH_SALT_ROUNDS } from '../config';
import { logger } from './logger';


/**
 * Hashes a given password using bcrypt with a salt for added security.
 */
export const hashPassword = async (password: string): Promise<string> => {
    try {
        const salt = await bcrypt.genSalt(Number(HASH_SALT_ROUNDS));
        return await bcrypt.hash(password, salt);
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
};


/**
 * Compares a plain text password with a hashed password to check if they match.
 */

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
};