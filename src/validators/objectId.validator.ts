import mongoose from "mongoose";

/**
 * Validates if a given string is a valid MongoDB ObjectId.
 */
export const isValidObjectId = (id: string):boolean => {
    return mongoose.Types.ObjectId.isValid(id);
}