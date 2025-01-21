import { Document, Types } from "mongoose";

export interface IBlackList extends Document {
    _id: Types.ObjectId;
    token: string;
    expireAt: Date;
};
