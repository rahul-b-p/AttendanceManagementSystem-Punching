import { TokenPayload } from '../interfaces';
import { ACCESS_TOKEN_EXPIRATION, ACCESS_TOKEN_SECRET } from '../config';
import { signToken, verifyToken } from './jwt.service';



/**
 * Function to sign new Access Token
 * */
export const signAccessToken = async (id: string, role: string): Promise<string> => {
    try {
        return signToken(id, role, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRATION);
    } catch (error: any) {
        throw new Error(error.message);
    }
}


/**
 * Function to verify an Access Token
 * */
export const verifyAccessToken = async (token: string): Promise<TokenPayload | null> => {
    return verifyToken(token, ACCESS_TOKEN_SECRET);
}