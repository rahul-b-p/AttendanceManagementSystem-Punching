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

export type IUserData = Omit<IUser, 'password' | 'refreshToken'>;

export type UserUpdateBody = {
    $set?: Partial<IUser>;
    $unset?: {
        refreshToken?: 1;
    };
};

export type UserAuthBody = UserBase;