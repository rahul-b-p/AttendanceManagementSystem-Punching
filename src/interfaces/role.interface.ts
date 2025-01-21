import { Document, Types } from "mongoose";
import { Actions, PermissionLevel } from "../enums";

export interface CustomRolePermission {
    action: Actions;
    level: PermissionLevel[]
}

export interface ICustomRole extends Document {
    _id: Types.ObjectId;
    role: string;
    permission: CustomRolePermission[];
}