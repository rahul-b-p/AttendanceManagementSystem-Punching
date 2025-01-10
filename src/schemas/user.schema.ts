import { z } from "zod";
import {  UserSortKeys } from "../enums";
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
            .string()
    })
    .strict({ message: "Role is required." });



export const userAuthSchema = z
    .object({
        email: z
            .string({ message: "Email is required." })
            .email({ message: "Invalid Email Format" }),
        password: passwordSchema,
    })
    .strict('Invalid Request Body');



export const userOtpValidationSchema = z.object({
    email: z.string({ message: "Email is required." }).email({ message: "Invalid Email Format" }),
    otp: otpSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
}).strict().refine(
    (data) => data.password === data.confirmPassword,
    {
        message: "Passwords do not match",
        path: ["confirmPassword"], // This points the error to the `confirmPassword` field
    }
);
export const forgotPasswordSchema = z.object({
    email: z.string({ message: "Email is required." }).email({ message: "Invalid Email Format" })
});

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
            .string()
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
        role: z.string().optional(),
        sortKey: z.nativeEnum(UserSortKeys, { message: "sort keys should be 'createAt' or 'username'" }).optional()
    })
    .strict();



export const userSearchFilterQuerySchema = z
    .object({
        pageNo: z.string({ message: "Page number is required" }).regex(pageNumberRegex, "Page number should be provide in digits"),
        pageLimit: z.string({ message: "Page number is required" }).regex(pageNumberRegex, "Page number should be provide in digits"),
        role: z.string().optional(),
        sortKey: z.nativeEnum(UserSortKeys, { message: "sort keys should be 'createAt' or 'username'" }).optional(),
        username: z.string().optional()
    })