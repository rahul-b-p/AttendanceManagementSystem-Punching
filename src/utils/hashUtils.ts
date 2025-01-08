import bcrypt from 'bcrypt';
import { HASH_SALT_ROUNDS } from '../config';
import { logger } from './logger';

export const hashPassword = async (password: string): Promise<string> => {
    try {
        const salt = await bcrypt.genSalt(Number(HASH_SALT_ROUNDS));
        return await bcrypt.hash(password, salt);
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
};