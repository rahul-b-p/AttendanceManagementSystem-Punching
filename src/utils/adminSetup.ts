import { ADMIN_EMAIL, ADMIN_PHONE, ADMIN_USERNAME } from "../config";
import { errorMessage, responseMessage } from "../constants";
import { FunctionStatus, Roles } from "../enums";
import { createUserSchema } from "../schemas";
import { checkAdminExists, insertUser, validateEmailUniqueness } from "../services";
import { UserInsertArgs } from "../types";
import { checkEmailValidity } from "../validators";
import { logFunctionInfo } from "./logger";

/**
 * Creates a default admin using system admin credentials from the environment variables, if no admin exists in the system.
 */
export const createDefaultAdmin = async (): Promise<void> => {
    const functionName = 'createDefaultAdmin';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const isAdminExists = await checkAdminExists()
        if (isAdminExists) {
            logFunctionInfo(functionName, FunctionStatus.success, 'Admin Exists');
            return;
        }

        const isValidEmail = await checkEmailValidity(ADMIN_EMAIL);
        if (!isValidEmail) throw new Error(errorMessage.INVALID_EMAIL_ID);

        const user: UserInsertArgs = {
            username: ADMIN_USERNAME,
            email: ADMIN_EMAIL,
            phone: ADMIN_PHONE,
            role: Roles.admin
        };
        createUserSchema.parse(user);

        const isUniqueEmial = await validateEmailUniqueness(user.username);
        if (!isUniqueEmial) {
            throw new Error(errorMessage.EMAIL_ALREADY_IN_USE);
        }

        const defaultAdmin = await insertUser(user);
        logFunctionInfo(functionName, FunctionStatus.success, responseMessage.DEFAULT_ADMIN_CREATED + defaultAdmin._id);
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        process.exit(1);
    }
}
