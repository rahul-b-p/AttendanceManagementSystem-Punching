import { Roles } from "../enums";
import { IUser } from "../interfaces";

type UserBase = {
    email: string;
    password: string;
}

export type UserInsertArgs = UserBase & {
    username: string;
    phone: string;
    role: Roles
};

export type IUserData = Omit<IUser, 'password' | 'refreshToken'|'isFirstLogin'>;

export type UserUpdateBody = {
    $set?: Partial<IUser>;
    $unset?: {
        refreshToken?: 1;
    };
};

export type UserAuthBody = UserBase;

export type UserLoginOtpReq = {
    otp: string;
    email: string;
}

export type UserPasswordResetReq = UserLoginOtpReq & { password: string }