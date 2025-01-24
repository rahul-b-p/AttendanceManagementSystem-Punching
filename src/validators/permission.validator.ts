import { Actions } from "../enums";
import { CustomRolePermission } from "../interfaces";
import { findCustomRole } from "../services";
import { logger } from "../utils";



/**
 * Validates whether the required action is permitted for a specific role, based on the provided permission set.
 */
export const permissionValidator = async (permissionSet: CustomRolePermission[], role: string, requiredAction: Actions): Promise<boolean> => {
    try {
        const customRole = await findCustomRole(role);
        if (!customRole) return false;

        for (let permission of customRole.permission) {

            if (permission.action !== requiredAction) {
                return false;
            }

            for (let allwedPermission of permissionSet) {

                if (permission.action == allwedPermission.action) {

                    for (let level of permission.level) {

                        if (allwedPermission.level.includes(level)) {

                            return true;

                        }
                    }
                }
            }
        };

        return false;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}