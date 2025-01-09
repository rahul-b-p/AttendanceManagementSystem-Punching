import { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_PHONE, ADMIN_USERNAME } from "../config";
import { Roles } from "../enums";
import { createUserSchema } from "../schemas";
import { checkAdminExists, insertUser, validateEmailUniqueness } from "../services";
import { UserInsertArgs } from "../types";
import { checkEmailValidity } from "../validators";
import { logger } from "./logger";


export const createDefaultAdmin = async () => {
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
            password: ADMIN_PASSWORD,
            role: Roles.admin
        };
        createUserSchema.parse(user);

        const isUniqueEmial = validateEmailUniqueness(user.username);
        if (!isUniqueEmial) {
            logger.error('')
        }

        const defaultAdmin = await insertUser(user);
        logger.info(`Default admin user created successfully with ID: ${defaultAdmin._id}`);
    } catch (error: any) {
        logger.error(`Failed to create a Default Admin:${error.message}`);
        process.exit(1);
    }
}
