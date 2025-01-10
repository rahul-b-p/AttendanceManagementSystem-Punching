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
    isFirstLogin: {
        type: Boolean,
        default: true,
        required: true
    },
    createAt: {
        type: Date,
        default: () => new Date()
    }
}, {
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
        }
    }
}
);

userSchema.pre('save', async function (next) {
    if (this.isModified('password') || this.isNew) {
        try {
            if (this.password) {
                this.password = await hashPassword(this.password);
            }
            next();
        } catch (err: any) {
            next(err);
        }
    } else {
        next();
    }
});

const User = mongoose.model<IUser>('users', userSchema);

export default User;