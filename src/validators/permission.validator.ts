import { Actions, FunctionStatus } from "../enums";
import { CustomRolePermission } from "../interfaces";
import { findCustomRole } from "../services";
import { logFunctionInfo } from "../utils";



/**
 * Validates whether the required action is permitted for a specific role, based on the provided permission set.
 */
export const permissionValidator = async (permissionSet: CustomRolePermission[], role: string, requiredAction: Actions): Promise<boolean> => {
    const functionName = 'permissionValidator';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const customRole = await findCustomRole(role);
        if (!customRole) return false;

        for (let permission of customRole.permission) {

            if (permission.action == requiredAction) {

                for (let allwedPermission of permissionSet) {

                    if (permission.action == allwedPermission.action) {

                        for (let level of permission.level) {

                            if (allwedPermission.level.includes(level)) {

                                logFunctionInfo(functionName, FunctionStatus.success);
                                return true;

                            }
                        }
                    }
                }
            }
        };

        return false;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}