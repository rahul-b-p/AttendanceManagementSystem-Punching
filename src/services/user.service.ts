import { string } from "zod";
import { Roles, UserSortArgs } from "../enums";
import { IUser } from "../interfaces";
import { User } from "../models";
import { IUserData, UserInsertArgs, userQuery, UserSearchQuery, UserToShow, UserUpdateArgs } from "../types";
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
        const { password, refreshToken, ...userWithoutSensitiveData } = updatedUser;
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

export const fetchUsers = async (page: number, query: userQuery, sort: UserSortArgs, username?: string): Promise<UserToShow[] | null> => {
    try {
        const limit = 10;
        const skip = (page - 1) * limit;

        const matchFilter: any = { ...query };
        if (username) {
            matchFilter.username = { $regex: username, $options: "i" };
        }

        const users: UserToShow[] = await User.aggregate([
            { $match: matchFilter },
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
            },
        ]);

        return users.length > 0 ? users : null;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
};

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

export const getUserData = async (_id: string): Promise<UserToShow> => {
    try {
        const user = await User.findById(_id, { password: 0, refreshToken: 0, __v: 0 }).lean();
        return user as UserToShow;
    } catch (error:any) {
        logger.error
        throw new Error(error.message);
    }
}