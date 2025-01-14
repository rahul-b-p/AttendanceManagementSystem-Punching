import { Types } from "mongoose";
import { Roles, UserSortKeys } from "../enums";
import { IUser } from "../interfaces";
import { number } from "zod";
import { PageInfo } from "./page.type";

export type UserAuthBody = {
    email: string;
    password: string;
};

export type UserInsertArgs = {
    username: string;
    email: string;
    phone: string;
    role: Roles;
};

export type IUserData = Omit<IUser, 'password' | 'refreshToken' | 'verified' | '__v'>;

export type UserUpdateArgs = {
    $set?: Partial<IUser>;
    $unset?: {
        refreshToken?: 1;
    };
};


export type UserLoginOtpReq = {
    otp: string;
    email: string;
};

export type UserOtpVerifyBody = UserLoginOtpReq & {
    password: string;
    confirmPassword: string;
}

export type UserPasswordResetReq = UserLoginOtpReq & { password: string };

export type UserUpdateBody = Partial<UserInsertArgs>;

export type UserFilterQuery = {
    pageNo: string;
    pageLimit: string;
    role?: Roles;
    sortKey?: UserSortKeys;
};

export type userQuery = Partial<UserInsertArgs>;


export type UserToShow = UserInsertArgs & {
    _id: Types.ObjectId;
    createAt: Date;
}

export type UserSearchQuery = {
    username?: string;
}

export type UserFetchResult = PageInfo & {
    data: UserToShow[];
}