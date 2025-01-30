import { FunctionStatus, Roles } from "../enums"
import { findCustomRole } from "../services"
import { logFunctionInfo, logger } from "../utils";



/**
 * Validates whether the given role is a default role or a custom role.
*/
export const validateRole = async (role: string): Promise<boolean> => {
    const functionName = 'validateRole';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        if (Object.values(Roles).includes(role as Roles)) {
            return true;
        }

        const roleData = await findCustomRole(role);

        logFunctionInfo(functionName, FunctionStatus.success);
        return roleData !== null;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message)
    }
}