import mongoose, { Schema } from "mongoose";
import { IBlackList } from "../interfaces";

const blacklistSchema = new Schema<IBlackList>({
    token: {
        type: String,
        required: true,
        unique: true
    },
    expireAt: {
        type: Date,
        required: true
    },
});

blacklistSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const Blacklist = mongoose.model('blacklists', blacklistSchema);
export default Blacklist;