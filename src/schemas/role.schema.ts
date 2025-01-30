import { z } from "zod";
import { PermissionLevel, Roles } from "../enums";
import { pageNumberRegex } from "../utils";
import { errorMessage } from "../constants";



const permissionSchema = z.nativeEnum(PermissionLevel, {
    message: errorMessage.INVALID_PERMISSION_LEVEL
}).optional();

export const createCustomRoleSchema = z.object({
    role: z.string({ message: errorMessage.ROLE_NAME_REQUIRED }).min(3),
    create: permissionSchema,
    read: permissionSchema,
    update: permissionSchema,
    delete: permissionSchema
}).strict()
    .refine(data => !Object.values(Roles).includes(data.role as Roles), {
        message: errorMessage.CANNOT_BE_DEFAULT_ROLE + Object.values(Roles).join(", ")
    })
    .refine(data => data.create || data.read || data.update || data.delete, {
        message: errorMessage.PERMISSION_FIELD_REQUIRED
    });




export const roleFilterSchema = z.object({
    pageNo: z.string({ message: errorMessage.PAGE_NUMBER_REQUIRED }).regex(pageNumberRegex, errorMessage.PAGE_NUMBER_MUST_BE_DIGITS),
    pageLimit: z.string({ message: errorMessage.PAGE_LIMIT_REQUIRED }).regex(pageNumberRegex, errorMessage.PAGE_LIMIT_MUST_BE_DIGITS)
}).strict();



export const updateCustomRoleSchema = z.object({
    role: z.string().min(3).optional(),
    create: permissionSchema,
    read: permissionSchema,
    update: permissionSchema,
    delete: permissionSchema
}).strict()
    .refine(data => !Object.values(Roles).includes(data.role as Roles), {
        message: errorMessage.CANNOT_BE_DEFAULT_ROLE + Object.values(Roles).join(", ")
    })
    .refine(data => data.create || data.read || data.update || data.delete || data.role, {
        message: errorMessage.REQUIRED_FOR_ROLE_UPDATE
    });

    