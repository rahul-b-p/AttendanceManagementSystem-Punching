import { TokenPayload } from '../interfaces';
import { REFRESH_TOKEN_EXPIRATION, REFRESH_TOKEN_SECRET } from '../config';
import { signToken, verifyToken } from './jwt.service';
import { logFunctionInfo } from '../utils';
import { FunctionStatus } from '../enums';

/**
 * Function to sign new Refresh Token
 * */
export const signRefreshToken = async (id: string, role: string): Promise<string> => {
    logFunctionInfo('signRefreshToken', FunctionStatus.start);

    return signToken(id, role, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRATION);
}


/**
 * Function to verify a Refresh Token
 * */
export const verifyRefreshToken = async (token: string): Promise<TokenPayload | null> => {
    logFunctionInfo("verifyRefreshToken", FunctionStatus.start);
    return verifyToken(token, REFRESH_TOKEN_SECRET);
}