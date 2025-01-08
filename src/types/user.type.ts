import { Roles } from "../enums";
import { IUser } from "../interfaces";


export type UserInsertArgs = {
    username: string;
    email: string;
    phone:string;
    password: string;
    role:Roles
};

export type IUserData = Omit<IUser, 'password' |'refreshToken'>;