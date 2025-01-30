import jwt, { JsonWebTokenError } from 'jsonwebtoken'
import { logFunctionInfo, logger } from '../utils';
import { TokenPayload } from '../interfaces';
import { expirationSchema, secretKeySchema } from './jwt.schema';
import { ZodError } from 'zod';
import { StringValue } from './jwt.type';
import { FunctionStatus } from '../enums';




/**
 * Function to sign new JWT token with secret and payload
 * */
export const signToken = async (id: string, role: string, secretKey: string, expiration: string): Promise<string> => {

    const functionName = 'signToken';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        secretKeySchema.parse(secretKey);
        expirationSchema.parse(expiration);
        const token = jwt.sign({ id, role }, secretKey, { expiresIn: expiration as StringValue });
        logFunctionInfo(functionName, FunctionStatus.success);
        return token;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);

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
    const functionName = 'verifyToken';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        secretKeySchema.parse(secretKey);
        const payload = jwt.verify(token, secretKey) as TokenPayload;
        logFunctionInfo(functionName, FunctionStatus.success);
        return payload;
    } catch (error) {
        logFunctionInfo(functionName, FunctionStatus.fail);

        if (error instanceof ZodError) {
            throw new Error(`Invalid secret key: ${error.message}`);
        }

        if (error instanceof JsonWebTokenError) {
            logger.warn("Invalid token");
        }

        return null;
    }
}