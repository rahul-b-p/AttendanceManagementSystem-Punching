import { Actions, PermissionLevel, Roles } from "../enums";
import { CustomRolePermission } from "../interfaces";
import { PermissionInputFormat } from "../types";
import { logger } from "./logger";


/**
 * Retrieves the permission set based on the provided default roles, mapping each role to its associated permission level.
 */
export const getPermissionSetFromDefaultRoles = (...roles: Roles[]): CustomRolePermission[] => {
    try {
        const permissionLevelMap = {
            [Roles.admin]: PermissionLevel.all,
            [Roles.manager]: PermissionLevel.group,
            [Roles.employee]: PermissionLevel.own,
        };

        const levels = roles.map((role) => {
            return permissionLevelMap[role];
        });
        if (!levels.length) {
            throw new Error('Role not found.');
        }

        const basicActions = [Actions.create, Actions.read, Actions.update, Actions.delete];
        return basicActions.map(action => ({
            action,
            level: levels
        }));

    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
};


/**
 * Retrieves the roles associated with the given permission set by mapping permission levels back to their corresponding roles.
 */
export const getRolesFromPermissionSet = (permissions: CustomRolePermission[]): Roles[] => {
    try {
        const permissionLevelMap = {
            [PermissionLevel.all]: Roles.admin,
            [PermissionLevel.group]: Roles.manager,
            [PermissionLevel.own]: Roles.employee,
        };

        // Extract levels from permissions and map them back to roles
        const levels = new Set(
            permissions.map((permission) => permission.level).flat()
        );

        const roles = Array.from(levels).map((level) => {
            if (permissionLevelMap[level]) {
                return permissionLevelMap[level];
            } else {
                throw new Error(`Invalid permission level: ${level}`);
            }
        });

        if (!roles.length) {
            throw new Error('No roles found for the given permissions.');
        }

        return roles;

    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
};


/**
 * Formats a permission set for storage in the database by validating and structuring the input.
 */
export const formatPermissionSetForDB = (permissionSet: PermissionInputFormat): CustomRolePermission[] => {
    const formattedPermissionSet: CustomRolePermission[] = [];

    for (const key in permissionSet) {
        if (Object.values(Actions).includes(key as Actions)) {
            const actionKey = key as keyof typeof Actions;

            if (Object.values(PermissionLevel).includes(permissionSet[actionKey] as PermissionLevel)) {
                formattedPermissionSet.push({
                    action: actionKey as Actions,
                    level: [permissionSet[actionKey] as PermissionLevel],
                });
            } else {
                logger.warn(`Invalid value "${permissionSet[actionKey]}" for key "${key}". Allowed values are: ${Object.values(PermissionLevel).join(", ")}`);
            }
        } else {
            logger.warn(`Invalid key "${key}" in input object. Allowed keys are: ${Object.values(Actions).join(", ")}`);
        }
    }

    return formattedPermissionSet;
};