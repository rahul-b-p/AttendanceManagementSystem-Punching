import mongoose from "mongoose";
import { FunctionStatus } from "../enums";
import { logFunctionInfo } from "../utils";

/**
 * Validates if a given string is a valid MongoDB ObjectId.
 */
export const isValidObjectId = (id: string): boolean => {
    logFunctionInfo("isValidObjectId", FunctionStatus.start);

    return mongoose.Types.ObjectId.isValid(id);
}