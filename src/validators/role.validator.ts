import { Roles } from "../enums"
import { findCustomRole } from "../services"
import { logger } from "../utils";



/**
 * Validates whether the given role is a default role or a custom role.
*/
export const validateRole = async (role: string): Promise<boolean> => {
    try {
        if (Object.values(Roles).includes(role as Roles)) {
            return true;
        }

        const roleData = await findCustomRole(role);
        return roleData !== null;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message)
    }
}