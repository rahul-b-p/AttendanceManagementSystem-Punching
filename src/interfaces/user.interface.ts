import { Document, Types } from "mongoose";



export interface IUser extends Document {
    _id: Types.ObjectId;
    username: string;
    email: string;
    phone: string;
    password?: string;
    role: string;
    refreshToken?: string;
    verified: boolean;
    createAt: Date;
    officeId: Types.ObjectId;
}