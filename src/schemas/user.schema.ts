import { z } from "zod";
import { Roles, UserSortKeys } from "../enums";
import { phoneSchema } from "./phone.schema";
import { passwordSchema } from "./password.schema";
import { otpSchema } from "./otp.schema";
import { pageNumberRegex } from "../utils";



export const createUserSchema = z
    .object({
        username: z
            .string({ message: "Username is required." })
            .min(5, "Username must be at least 5 characters long"),
        email: z
            .string({ message: "Email is required." })
            .email({ message: "Invalid Email Format" }),
        phone: phoneSchema,
        role: z
            .nativeEnum(Roles, { message: "role should be 'admin', 'manager' or 'employee'" })
    })
    .strict();



export const userAuthSchema = z
    .object({
        email: z
            .string({ message: "Email is required." })
            .email({ message: "Invalid Email Format" }),
        password: passwordSchema,
    })
    .strict('Invalid Request Body');




export const forgotPasswordSchema = z.
    object({
        email: z.string({ message: "Email is required." }).email({ message: "Invalid Email Format" })
    })
    .strict();



export const resetPasswordSchema = z
    .object({
        email: z
            .string({ message: "Email is required." })
            .email({ message: "Invalid Email Format" }),
        otp: otpSchema,
        password: passwordSchema
    })
    .strict()



export const updateUserSchema = z
    .object({
        username: z
            .string({ message: "Username is required." })
            .min(5, "Username must be at least 5 characters long")
            .optional(),
        email: z
            .string({ message: "Email is required." })
            .email({ message: "Invalid Email Format" })
            .optional(),
        phone: phoneSchema
            .optional(),
        role: z
            .nativeEnum(Roles, { message: "role should be 'admin', 'manager' or 'employee'" })
            .optional()
    })
    .strict()
    .refine((data) =>
        data.email || data.phone || data.role || data.username,
        { message: "Update body should contain any of update feilds, username, email, phone, role" }
    );



export const userFilterQuerySchema = z
    .object({
        pageNo: z.string({ message: "Page number is required" }).regex(pageNumberRegex, "Page number should be provide in digits"),
        pageLimit: z.string({ message: "Page limit is required" }).regex(pageNumberRegex, "Page limit should be provide in digits"),
        role: z.nativeEnum(Roles, { message: "role should be 'admin', 'manager' or 'employee'" }).optional(),
        sortKey: z.nativeEnum(UserSortKeys, { message: "sort keys should be 'createAt' or 'username'" }).optional()
    })
    .strict();



export const userSearchFilterQuerySchema = z
    .object({
        pageNo: z.string({ message: "Page number is required" }).regex(pageNumberRegex, "Page number should be provide in digits"),
        pageLimit: z.string({ message: "Page number is required" }).regex(pageNumberRegex, "Page number should be provide in digits"),
        role: z.nativeEnum(Roles, { message: "role should be 'admin', 'manager' or 'employee'" }).optional(),
        sortKey: z.nativeEnum(UserSortKeys, { message: "sort keys should be 'createAt' or 'username'" }).optional(),
        username: z.string().optional()
    })