import mongoose, { Schema } from "mongoose";
import { Roles } from "../enums";
import { IUser } from "../interfaces";
import { hashPassword } from "../utils";



const userSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: Object.values(Roles)
    },
    refreshToken: {
        type: String,
        required: false,
    },
    createAt: {
        type: Date,
        default: () => new Date()
    }
});

userSchema.pre('save', async function (next) {
    if (this.isModified('password') || this.isNew) {
        try {
            this.password = await hashPassword(this.password);
            next();
        } catch (err:any) {
            next(err);
        }
    } else {
        next();
    }
});

const User = mongoose.model<IUser>('users', userSchema);

export default User;