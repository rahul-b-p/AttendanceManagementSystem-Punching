import { startSession, Types } from "mongoose";
import { FunctionStatus, Roles, UserSortArgs } from "../enums";
import { IUser } from "../interfaces";
import { Attendance, User } from "../models";
import { IUserData, UserFetchResult, UserInsertArgs, userQuery, UserToShow, UserUpdateArgs } from "../types";
import { logFunctionInfo } from "../utils";
import { setUserToOfficeById } from "./office.service";



/**
 * Checks if an admin exists in the database.
*/
export const checkAdminExists = async (): Promise<boolean> => {
    const functionName = 'checkAdminExists';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const adminExists = await User.exists({ role: Roles.admin });
        logFunctionInfo(functionName, FunctionStatus.success);
        return adminExists !== null;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 * Validates the uniqueness of an email by checking if any user is registered with the given email address.
*/
export const validateEmailUniqueness = async (email: string): Promise<boolean> => {
    const functionName = 'validateEmailUniqueness';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const emailExists = await User.exists({ email });

        logFunctionInfo(functionName, FunctionStatus.success);
        return emailExists === null;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 * Inserts a new user with required feilds
*/
export const insertUser = async (user: UserInsertArgs): Promise<IUserData> => {
    const functionName = 'insertUser';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const newUser: IUser = new User(user);
        await newUser.save();
        if (newUser.officeId) {
            await setUserToOfficeById(newUser.officeId.toString(), newUser._id.toString(), Roles.employee);
        }
        delete (newUser as any).__v;
        const { password, refreshToken, verified, ...userWithoutSensitiveData } = newUser.toObject()

        logFunctionInfo(functionName, FunctionStatus.success);
        return userWithoutSensitiveData as IUserData;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 * Finds an existing user by its unique email adress.
*/
export const findUserByEmail = async (email: string): Promise<IUser | null> => {
    const functionName = 'findUserByEmail';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const user = await User.findOne({ email });

        logFunctionInfo(functionName, FunctionStatus.success);
        return user;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 * Updates an existing user data by its unique id.
*/
export const updateUserById = async (_id: string, userToUpdate: UserUpdateArgs): Promise<IUserData | null> => {
    const functionName = 'updateUserById';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const updatedUser = await User.findByIdAndUpdate(_id, userToUpdate, { new: true }).lean();
        if (!updatedUser) return null;

        delete (updatedUser as any).__v;
        const { password, refreshToken, ...userWithoutSensitiveData } = updatedUser;

        logFunctionInfo(functionName, FunctionStatus.success);
        return userWithoutSensitiveData as IUserData;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
};


/**
 * Checks if a refresh token exists for a user by their unique ID.
 */
export const checkRefreshTokenExistsById = async (_id: string, refreshToken: string): Promise<boolean> => {
    const functionName = 'checkRefreshTokenExistsById';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const UserExists = await User.exists({ _id, refreshToken });

        logFunctionInfo(functionName, FunctionStatus.success);
        return UserExists !== null;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail);
        throw new Error(error.message);
    }
}


/**
 * Finds a user by its unique ID
 */
export const findUserById = async (_id: string): Promise<IUser | null> => {
    const functionName = 'findUserById';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const user = await User.findById(_id).lean();

        logFunctionInfo(functionName, FunctionStatus.success);
        return user;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 * Fetches all users using aggregation with support for filtering, sorting, and pagination.
 */
export const fetchUsers = async (page: number, limit: number, query: userQuery, sort: UserSortArgs, username?: string): Promise<UserFetchResult | null> => {
    const functionName = 'fetchUsers';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const skip = (page - 1) * limit;

        const matchFilter: any = { ...query };
        if (username) {
            matchFilter.username = { $regex: username, $options: "i" };
        }

        const totalFilter = await User.aggregate([
            { $match: matchFilter },
            {
                $count: 'totalCount'  // Count all documents matching the filter
            }
        ]);

        const totalItems = totalFilter.length > 0 ? totalFilter[0].totalCount : 0;

        const users: UserToShow[] = await User.aggregate([
            { $match: matchFilter },
            { $sort: JSON.parse(sort) },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'offices',
                    localField: 'officeId',
                    foreignField: '_id',
                    as: 'office',
                }
            },
            {
                $unwind: {
                    path: "$office",
                    preserveNullAndEmptyArrays: true,
                }
            },
            {
                $project: {
                    _id: 1,
                    username: 1,
                    email: 1,
                    phone: 1,
                    role: 1,
                    createAt: 1,
                    verified: 1,
                    office: {
                        _id: 1,
                        officeName: 1,
                        adress: {
                            street: 1,
                            city: 1,
                            state: 1,
                            zip_code: 1
                        },
                        location: {
                            latitude: 1,
                            longitude: 1
                        },
                        radius: 1
                    }
                },
            },
        ]);

        const totalPages = Math.ceil(totalItems / limit);
        const fetchResult: UserFetchResult = {
            page,
            pageSize: limit,
            totalPages,
            totalItems,
            data: users
        }

        logFunctionInfo(functionName, FunctionStatus.success);
        return users.length > 0 ? fetchResult : null;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
};


/**
 * Delets an existing user data by its unique id.
*/
export const deleteUserById = async (_id: string): Promise<void> => {
    const functionName = 'deleteUserById';
    logFunctionInfo(functionName, FunctionStatus.start);

    const session = await startSession();
    session.startTransaction();

    try {
        const deletedUser = await User.findByIdAndDelete(_id);

        await Attendance.deleteMany({ userId: _id });

        await session.commitTransaction();
        session.endSession();
        logFunctionInfo(functionName, FunctionStatus.success);
        if (!deletedUser) throw new Error('Invalid Id provided for deletion');
        else return;
    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();

        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 * Fetches an existing user along with all their related fields from other collections, while keeping sensitive data hidden.
*/
export const getUserData = async (_id: string): Promise<UserToShow | null> => {
    const functionName = 'getUserData';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const user = await User.aggregate([
            {
                $match: { _id: new Types.ObjectId(_id) }
            },
            {
                $lookup: {
                    from: 'offices',
                    localField: 'officeId',
                    foreignField: '_id',
                    as: 'office',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                officeName: 1,
                                adress: {
                                    street: 1,
                                    city: 1,
                                    state: 1,
                                    zip_code: 1
                                },
                                location: {
                                    latitude: 1,
                                    longitude: 1
                                },
                                radius: 1
                            },
                        },
                    ]
                }
            },
            {
                $unwind: {
                    path: "$office",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'attendances',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'attendances',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                punchIn: 1,
                                punchOut: 1,
                                location: 1,
                            },
                        },
                    ]
                }
            }, {
                $project: {
                    __v: 0,
                    password: 0,
                    refreshToken: 0,
                }
            }
        ]);
        if (user.length <= 0) return null

        logFunctionInfo(functionName, FunctionStatus.success);
        return user[0] as UserToShow;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail);
        throw new Error(error.message);
    }
}