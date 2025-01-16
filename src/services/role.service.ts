import { Roles } from "../enums";
import { CustomRolePermission, ICustomRole } from "../interfaces";
import { CustomRole, User } from "../models"
import { InsertRoleArgs, RolesFetchResult, UpdateRoleArgs } from "../types";
import { formatPermissionSetForDB, logger } from "../utils";




export const findCustomRole = async (role: string): Promise<ICustomRole | null> => {
    try {
        return await CustomRole.findOne({ role });
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const insertRole = async (newRoleInfo: InsertRoleArgs): Promise<ICustomRole> => {
    try {
        const { role, ...permissionSet } = newRoleInfo
        const permission = formatPermissionSetForDB(permissionSet);

        const newRole = new CustomRole({
            role, permission
        });

        newRole.save();

        delete (newRole as any).__v;
        return newRole;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const fetchCustomRoles = async (page: number, limit: number): Promise<RolesFetchResult | null> => {
    try {
        const skip = (page - 1) * limit;

        const totalFilter = await CustomRole.aggregate([{ $count: 'totalCount' }]);
        const totalItems = totalFilter.length > 0 ? totalFilter[0].totalCount : 0;

        const roles: ICustomRole[] = await CustomRole.aggregate([
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

        return roles.length > 0 ? fetchResult : null;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const updateCustomRoleById = async (_id: string, roleUpdateInfo: UpdateRoleArgs): Promise<ICustomRole | null> => {
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
        return updatedRole as ICustomRole;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
};

export const deleteCustomRoleById = async (_id: string): Promise<boolean> => {
    try {
        const deletedRole = await CustomRole.findByIdAndDelete(_id);
        // Setup to update role into employee, defaulty when a custom role deleted by admin
        if (deletedRole) {
            await User.updateMany({ role: deletedRole.role }, { $set: { role: Roles.employee } })
        }
        return deletedRole !== null;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}