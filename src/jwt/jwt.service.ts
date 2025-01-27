import jwt, { JsonWebTokenError } from 'jsonwebtoken'
import { logger } from '../utils';
import { TokenPayload } from '../interfaces';
import { expirationSchema, secretKeySchema } from './jwt.schema';
import { ZodError } from 'zod';
import { StringValue } from './jwt.type';




/**
 * Function to sign new JWT token with secret and payload
 * */
export const signToken = async (id: string, role: string, secretKey: string, expiration: string): Promise<string> => {
    try {
        secretKeySchema.parse(secretKey);
        expirationSchema.parse(expiration);
        return jwt.sign({ id, role }, secretKey, { expiresIn: expiration as StringValue });
    } catch (error: any) {
        logger.error("Error while signing the token:", error);

        if (error instanceof ZodError) {
            throw new Error(`Invalid secret key: ${error.message}`);
        }

        if (error instanceof jwt.JsonWebTokenError) {
            logger.error("JWT signing failed", error);
            throw new Error("Failed to sign the token. Please check your secret key and expiration time.");
        }

        throw new Error("Unexpected error occurred while signing the token.");
    }
}


/**
 * Function to verify a JWT token
 * */
export const verifyToken = async (token: string, secretKey: string): Promise<TokenPayload | null> => {
    try {
        secretKeySchema.parse(secretKey);
        return jwt.verify(token, secretKey) as TokenPayload;
    } catch (error) {
        logger.error(error);

        if (error instanceof ZodError) {
            throw new Error(`Invalid secret key: ${error.message}`);
        }

        if (error instanceof JsonWebTokenError) {
            logger.warn("Invalid token");
        }

        return null;
    }
}