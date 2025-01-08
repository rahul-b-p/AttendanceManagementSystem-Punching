import { Roles } from "../enums";
import { IUser } from "../interfaces";
import { User } from "../models";
import { IUserData, UserInsertArgs } from "../types";
import { logger } from "../utils";


export const checkAdminExists = async () => {
    try {
        const adminExists = await User.exists({ role: Roles.admin });
        return adminExists !== null;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const validateEmailUniqueness = async (email: string): Promise<boolean> => {
    try {
        const emailExists = await User.exists({ email });
        return emailExists !== null;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const insertUser = async (user: UserInsertArgs): Promise<IUserData> => {
    try {
        const newUser: IUser = new User(user);
        await newUser.save();

        const { password, refreshToken, ...userWithoutSensitiveData } = newUser.toObject()
        return userWithoutSensitiveData;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}