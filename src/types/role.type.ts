import { PermissionLevel } from "../enums";
import { ICustomRole } from "../interfaces";
import { PageInfo } from "./page.type";

export type InsertRoleArgs = {
    role: string;
    create?: PermissionLevel;
    read?: PermissionLevel;
    update?: PermissionLevel;
    delete?: PermissionLevel;
}

export type PermissionInputFormat = Omit<InsertRoleArgs, 'role'>;

export type CustomRolesFilter = {
    pageNo: string;
    pageLimit: string;
    role?: string;
}

export type RolesFetchResult = PageInfo & {
    data: ICustomRole[]
}

export type UpdateRoleArgs = Partial<InsertRoleArgs>;