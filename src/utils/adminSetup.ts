import { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_PHONE, ADMIN_USERNAME } from "../config";
import { Roles } from "../enums";
import { createUserSchema } from "../schemas";
import { checkAdminExists, insertUser, validateEmailUniqueness } from "../services";
import { UserInsertArgs } from "../types";
import { logger } from "./logger";


export const createDefaultAdmin = async () => {
    try {

        const isAdminExists = await checkAdminExists()
        if (isAdminExists) {
            logger.info('Admin exists.');
            return;
        }

        const user: UserInsertArgs = {
            username: ADMIN_USERNAME,
            email: ADMIN_EMAIL,
            phone: ADMIN_PHONE,
            password: ADMIN_PASSWORD,
            role: Roles.admin
        };
        createUserSchema.parse(user);

        const isUniqueEmial = await validateEmailUniqueness(user.username);
        if (!isUniqueEmial) {
            throw new Error("got mail from env is not unique")
        }

        const defaultAdmin = await insertUser(user);
        logger.info(`Default admin user created successfully with ID: ${defaultAdmin._id}`);
    } catch (error: any) {
        logger.error(`Failed to create a Default Admin:${error.message}`);
        process.exit(1);
    }
}
