import { ADMIN_EMAIL, ADMIN_PHONE, ADMIN_USERNAME } from "../config";
import { Roles } from "../enums";
import { createUserSchema } from "../schemas";
import { checkAdminExists, insertUser, validateEmailUniqueness } from "../services";
import { UserInsertArgs } from "../types";
import { checkEmailValidity } from "../validators";
import { logger } from "./logger";

/**
 * Creates a default admin using system admin credentials from the environment variables, if no admin exists in the system.
 */
export const createDefaultAdmin = async ():Promise<void> => {
    try {

        const isAdminExists = await checkAdminExists()
        if (isAdminExists) {
            logger.info('Admin exists.');
            return;
        }

        const isValidEmail = await checkEmailValidity(ADMIN_EMAIL);
        if (!isValidEmail) throw new Error("Invalid Email Provided on env");

        const user: UserInsertArgs = {
            username: ADMIN_USERNAME,
            email: ADMIN_EMAIL,
            phone: ADMIN_PHONE,
            role: Roles.admin
        };
        createUserSchema.parse(user);

        const isUniqueEmial = await validateEmailUniqueness(user.username);
        if (!isUniqueEmial) {
            throw new Error("Admin email is not unique");
        }

        const defaultAdmin = await insertUser(user);
        logger.info(`Default admin user created successfully with ID: ${defaultAdmin._id}`);
    } catch (error: any) {
        logger.error(`Failed to create a Default Admin:${error.message}`);
        process.exit(1);
    }
}
