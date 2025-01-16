import mongoose, { Schema } from "mongoose";
import { ICustomRole } from "../interfaces";
import { Actions, PermissionLevel } from "../enums";



const roleSchema = new Schema<ICustomRole>({
    role: {
        type: String,
        required: true,
        unique: true
    },
    permission: [
        {
            action: {
                type: String,
                enum: Object.values(Actions),
                required: true
            },
            level: [
                {
                    type: String,
                    enum: Object.values(PermissionLevel),
                    required: true
                }
            ]
        }
    ]
}, {
    timestamps: true
});


const CustomRole = mongoose.model('customRoles', roleSchema);

export default CustomRole;