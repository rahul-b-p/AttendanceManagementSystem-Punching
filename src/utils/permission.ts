import { Actions, PermissionLevel, Roles } from "../enums";
import { CustomRolePermission } from "../interfaces";
import { logger } from "./logger";

export const getPermissionSet = (...roles: Roles[]): CustomRolePermission[] => {
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