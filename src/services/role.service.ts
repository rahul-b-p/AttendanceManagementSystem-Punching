import { FunctionStatus, Roles } from "../enums";
import { ICustomRole } from "../interfaces";
import { CustomRole, User } from "../models"
import { InsertRoleArgs, RolesFetchResult, UpdateRoleArgs } from "../types";
import { formatPermissionSetForDB, getRolesFromPermissionSet, logFunctionInfo } from "../utils";



/**
 *  Finds a custom role data on database by its name.
*/
export const findCustomRole = async (role: string): Promise<ICustomRole | null> => {
    const functionName = 'findCustomRole';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const customRole = await CustomRole.findOne({ role });
        logFunctionInfo(functionName, FunctionStatus.success);
        return customRole;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail);
        throw new Error(error.message);
    }
}


/**
 *  Inserts a new custom role to the database with a unique.
*/
export const insertRole = async (newRoleInfo: InsertRoleArgs): Promise<ICustomRole> => {
    const functionName = 'insertRole';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { role, ...permissionSet } = newRoleInfo
        const permission = formatPermissionSetForDB(permissionSet);

        const newRole = new CustomRole({
            role, permission
        });

        newRole.save();
        delete (newRole as any).__v;

        logFunctionInfo(functionName, FunctionStatus.success);
        return newRole;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail);
        throw new Error(error.message);
    }
}


/**
 *  Fetches all custom roles on database with pagenation.
*/
export const fetchCustomRoles = async (page: number, limit: number, role?: string): Promise<RolesFetchResult | null> => {
    const functionName = 'fetchCustomRoles';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const skip = (page - 1) * limit;

        let matchFilter: any = {};
        if (role) {
            matchFilter["role"] = { $regex: role, $options: "i" };
        }
        const totalFilter = await CustomRole.aggregate([
            { $match: matchFilter },
            { $count: 'totalCount' }
        ]);
        const totalItems = totalFilter.length > 0 ? totalFilter[0].totalCount : 0;

        const roles: ICustomRole[] = await CustomRole.aggregate([
            { $match: matchFilter },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    role: 1,
                    permission: 1,
                },
            },
        ]);

        const totalPages = Math.ceil(totalItems / limit);
        const fetchResult: RolesFetchResult = {
            page,
            pageSize: limit,
            totalPages,
            totalItems,
            data: roles
        }

        logFunctionInfo(functionName, FunctionStatus.success);
        return roles.length > 0 ? fetchResult : null;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 *  Updates a custom role data on database by its unique Id.
*/
export const updateCustomRoleById = async (_id: string, roleUpdateInfo: UpdateRoleArgs): Promise<ICustomRole | null> => {
    const functionName = 'updateCustomRoleById';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { role, ...permissionSet } = roleUpdateInfo;
        let permission;
        if (Object.values(permissionSet).length > 0) {
            permission = formatPermissionSetForDB(permissionSet);
        }

        const existingRole = await CustomRole.findById(_id);
        if (!existingRole) {
            return null;
        }

        if (role) {
            existingRole.role = role;
        }

        if (permission) {
            permission.forEach(newPerm => {
                const existingPermIndex = existingRole.permission.findIndex(perm => perm.action === newPerm.action);
                if (existingPermIndex !== -1) {
                    existingRole.permission[existingPermIndex].level = newPerm.level;
                } else {
                    existingRole.permission.push(newPerm);
                }
            });
        }

        const updatedRole = await existingRole.save();

        logFunctionInfo(functionName, FunctionStatus.success);
        return updatedRole as ICustomRole;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
};


/**
 *  Deletes a custom role data on database by its unique Id.
*/
export const deleteCustomRoleById = async (_id: string): Promise<boolean> => {
    const functionName = 'deleteCustomRoleById';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const deletedRole = await CustomRole.findByIdAndDelete(_id);
        // Setup to update role into employee, defaulty when a custom role deleted by admin
        if (deletedRole) {
            await User.updateMany({ role: deletedRole.role }, { $set: { role: Roles.employee } })
        }

        logFunctionInfo(functionName, FunctionStatus.success);
        return deletedRole !== null;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 *  Retrieves default roles by comparing the permission set of a custom role.
*/
export const getDefaultRoleFromUserRole = async (roleString: string): Promise<Roles> => {
    const functionName = 'getDefaultRoleFromUserRole';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        if (Object.values(Roles).includes(roleString as Roles)) {
            logFunctionInfo(functionName, FunctionStatus.success);
            return roleString as Roles;
        }

        const customRole = await findCustomRole(roleString);
        if (!customRole) throw new Error('Provided Invalid Role');

        const defaultRoles = getRolesFromPermissionSet(customRole.permission);

        logFunctionInfo(functionName, FunctionStatus.success);
        if (defaultRoles.includes(Roles.admin)) return Roles.admin;
        else if (defaultRoles.includes(Roles.manager)) return Roles.manager;
        else return Roles.employee;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 * To find custom role using its unique id 
 */
export const findCustomRoleById = async (_id: string): Promise<ICustomRole | null> => {
    const functionName = findCustomRoleById.name;
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const customRole = await CustomRole.findById(_id);
        logFunctionInfo(functionName, FunctionStatus.success);

        return customRole
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}