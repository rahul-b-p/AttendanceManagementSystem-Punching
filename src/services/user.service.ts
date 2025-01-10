import { Roles, UserSortArgs } from "../enums";
import { IUser } from "../interfaces";
import { User } from "../models";
import { IUserData, UserInsertArgs, userQuery, UserToShow, UserUpdateArgs } from "../types";
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

        delete (newUser as any).__v;
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

export const updateUserById = async (_id: string, userToUpdate: UserUpdateArgs): Promise<IUserData | null> => {
    try {
        const updatedUser = await User.findByIdAndUpdate(_id, userToUpdate, { new: true }).lean();
        if (!updatedUser) return null;

        delete (updatedUser as any).__v;
        const { password, refreshToken, isFirstLogin, ...userWithoutSensitiveData } = updatedUser;
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

export const findUsers = async (page: number, query: userQuery, sort: UserSortArgs): Promise<UserToShow[] | null> => {
    try {
        const limit = 10;
        const skip = (page - 1) * limit;
        const users: UserToShow[] = await User.aggregate([
            { $match: query },
            { $sort: JSON.parse(sort) },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    username: 1,
                    email: 1,
                    phone: 1,
                    role: 1,
                    createAt: 1,
                },
            }
        ]);
        if (users.length == 0) return null;
        else return users;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const deleteUserById = async (_id: string): Promise<void> => {
    try {
        const deletedUser = await User.findByIdAndDelete(_id);
        if (!deletedUser) throw new Error('Invalid Id provided for deletion');
        else return;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}