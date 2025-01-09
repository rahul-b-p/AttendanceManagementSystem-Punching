import { Roles } from "../enums";
import { IUser } from "../interfaces";
import { User } from "../models";
import { IUserData, UserInsertArgs, UserUpdateBody } from "../types";
import { logger } from "../utils";


export const checkAdminExists = async (): Promise<boolean> => {
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
        return emailExists === null;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const insertUser = async (user: UserInsertArgs): Promise<IUserData> => {
    try {
        const newUser: IUser = new User(user);
        await newUser.save();

        const { password, refreshToken, isFirstLogin, ...userWithoutSensitiveData } = newUser.toObject()
        return userWithoutSensitiveData as IUserData;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const findUserByEmail = async (email: string): Promise<IUser | null> => {
    try {
        return await User.findOne({ email })
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const updateUserById = async (_id: string, userToUpdate: UserUpdateBody): Promise<IUserData | null> => {
    try {
        const updatedUser = await User.findByIdAndUpdate(_id, userToUpdate, { new: true });
        if (!updatedUser) return null;

        const { password, refreshToken, isFirstLogin, ...userWithoutSensitiveData } = updatedUser.toObject();
        return userWithoutSensitiveData as IUserData;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
};

export const checkRefreshTokenExistsById = async (_id: string, refreshToken: string): Promise<boolean> => {
    try {
        const UserExists = await User.exists({ _id, refreshToken });
        return UserExists !== null;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const findUserById = async (_id: string): Promise<IUser | null> => {
    try {
        return await User.findById(_id).lean();
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}