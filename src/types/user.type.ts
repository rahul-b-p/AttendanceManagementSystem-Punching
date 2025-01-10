import { Roles } from "../enums";
import { IUser } from "../interfaces";

export type UserAuthBody = {
    email: string;
    password: string;
}

export type UserInsertArgs = UserAuthBody & {
    username: string;
    phone: string;
    role: Roles
};

export type IUserData = Omit<IUser, 'password' | 'refreshToken' | 'isFirstLogin'|'__v'>;

export type UserUpdateArgs = {
    $set?: Partial<IUser>;
    $unset?: {
        refreshToken?: 1;
    };
};



export type UserLoginOtpReq = {
    otp: string;
    email: string;
}

export type UserPasswordResetReq = UserLoginOtpReq & { password: string }

export type UserUpdateBody = Partial<UserInsertArgs>