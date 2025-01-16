import mongoose, { Schema } from "mongoose";
import { ICustomRole } from "../interfaces";
import { Actions, PermissionLevel } from "../enums";



const roleSchema = new Schema<ICustomRole>(
    {
        role: {
            type: String,
            required: true,
            unique: true,
        },
        permission: [
            {
                _id: false, // Disable default _id generation for subdocuments
                action: {
                    type: String,
                    enum: Object.values(Actions),
                    required: true,
                },
                level: [
                    {
                        type: String,
                        enum: Object.values(PermissionLevel),
                        required: true,
                    },
                ],
            },
        ],
    },
    {
        timestamps: true,
        toJSON: {
            transform(doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
        toObject: {
            transform(doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
    }
);


const CustomRole = mongoose.model('customRoles', roleSchema);

export default CustomRole;