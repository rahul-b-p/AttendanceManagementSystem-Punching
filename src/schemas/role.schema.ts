import { z } from "zod";
import { PermissionLevel, Roles } from "../enums";
import { pageNumberRegex } from "../utils";



const permissionSchema = z.nativeEnum(PermissionLevel, {
    message: "level should be all, group or own"
}).optional();

export const createCustomRoleSchema = z.object({
    role: z.string({ message: "role name is required!" }).min(3),
    create: permissionSchema,
    read: permissionSchema,
    update: permissionSchema,
    delete: permissionSchema
}).strict()
    .refine(data => !Object.values(Roles).includes(data.role as Roles), {
        message: `Role cannot be one of the default roles: ${Object.values(Roles).join(", ")}`
    })
    .refine(data => data.create || data.read || data.update || data.delete, {
        message: "any of permission field is required"
    });



    
export const roleFilterSchema = z.object({
    pageNo: z.string({ message: "Page number is required" }).regex(pageNumberRegex, "Page number should be provide in digits"),
    pageLimit: z.string({ message: "Page number is required" }).regex(pageNumberRegex, "Page number should be provide in digits")
}).strict();



export const updateCustomRoleSchema = z.object({
    role: z.string({ message: "role name is required!" }).min(3).optional(),
    create: permissionSchema,
    read: permissionSchema,
    update: permissionSchema,
    delete: permissionSchema
}).strict()
    .refine(data => !Object.values(Roles).includes(data.role as Roles), {
        message: `Role cannot be one of the default roles: ${Object.values(Roles).join(", ")}`
    })
    .refine(data => data.create || data.read || data.update || data.delete || data.role, {
        message: "role, or permission feilds are required for updation"
    });
