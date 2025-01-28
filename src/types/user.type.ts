import { Types } from "mongoose";
import { UserSortKeys } from "../enums";
import { IAttendance, IOffice, IUser } from "../interfaces";
import { PageInfo } from "./page.type";

export type UserAuthBody = {
    email: string;
    password: string;
};

export type UserInsertArgs = {
    username: string;
    email: string;
    phone: string;
    role: string;
    officeId?: string;
};

export type IUserData = Omit<IUser, 'password' | 'refreshToken' | 'verified' | '__v'>;

export type UserUpdateArgs = {
    $set?: Partial<IUser>;
    $unset?: {
        refreshToken?: 1;
        officeId?: 1
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
    role?: string;
    sortKey?: UserSortKeys;
};

export type userQuery = {
    officeId?: Types.ObjectId;
    role?: string;
};


export type UserToShow = UserInsertArgs & {
    _id: Types.ObjectId;
    createdAt: string;
    office?: IOffice;
    attendnaces?: IAttendance[];
}

export type UserSearchQuery = {
    username?: string;
}

export type UserFetchResult = PageInfo & {
    data: UserToShow[];
}

