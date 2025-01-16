import { Actions, PermissionLevel, Roles } from "../enums";
import { CustomRolePermission } from "../interfaces";
import { PermissionInputFormat } from "../types";
import { logger } from "./logger";

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