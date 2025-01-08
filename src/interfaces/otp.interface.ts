import { Document,Types } from "mongoose";


export interface IOtp extends Document {
    userId: Types.ObjectId;
    otp: string;
    expiresAt: Date;
    createdAt: Date;
}