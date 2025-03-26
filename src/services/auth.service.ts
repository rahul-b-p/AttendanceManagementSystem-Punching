import { FunctionStatus } from "../enums";
import { IUser } from "../interfaces";
import { signAccessToken, signRefreshToken } from "../jwt";
import { TokenResonse, UserUpdateArgs } from "../types";
import { hashPassword, logFunctionInfo } from "../utils";
import { updateUserById } from "./user.service";


/**
 * To sign tokens, and save refresh token
 */
export const signNewTokens = async (userData: IUser): Promise<TokenResonse> => {
    const functionName = signNewTokens.name;
    logFunctionInfo(functionName, FunctionStatus.start);

    try {

        const accessToken = await signAccessToken(userData._id.toString(), userData.role);
        const refreshToken = await signRefreshToken(userData._id.toString(), userData.role);

        const updateRefreshToken: UserUpdateArgs = { $set: { refreshToken } };
        await updateUserById(userData._id.toString(), updateRefreshToken);

        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer'
        }
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message)
    }
}

/**
 * to sign tokens with verifying account and saving the password
 */
export const verfyAccountAndSignNewTokens = async (userData: IUser, confirmPassword: string): Promise<TokenResonse> => {
    const functionName = verfyAccountAndSignNewTokens.name;
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const password = await hashPassword(confirmPassword);

        const accessToken = await signAccessToken(userData._id.toString(), userData.role);
        const refreshToken = await signRefreshToken(userData._id.toString(), userData.role);

        const updateRefreshToken: UserUpdateArgs = { $set: { refreshToken, verified: true, password } };
        await updateUserById(userData._id.toString(), updateRefreshToken);

        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer'
        }
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message)
    }
}