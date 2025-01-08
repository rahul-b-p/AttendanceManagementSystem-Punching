import { Roles } from "../enums";
import { TokenPayload } from '../interfaces';
import { REFRESH_TOKEN_EXPIRATION, REFRESH_TOKEN_SECRET } from '../config';
import { signToken, verifyToken } from './jwt.service';


export const signRefreshToken = async (id: string, role: Roles): Promise<string> => {
    return signToken(id, role, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRATION);
}

export const verifyRefreshToken = async (token: string): Promise<TokenPayload | null> => {
    return verifyToken(token, REFRESH_TOKEN_SECRET);
}