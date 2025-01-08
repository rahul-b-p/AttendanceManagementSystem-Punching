import mongoose, { Schema } from "mongoose";
import { IOtp } from "../interfaces";



const otpSchema = new Schema<IOtp>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 5 * 60 * 1000)
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model<IOtp>('otps', otpSchema);

export default Otp;