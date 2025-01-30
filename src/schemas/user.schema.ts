import { z } from "zod";
import { UserSortKeys } from "../enums";
import { phoneSchema } from "./phone.schema";
import { passwordSchema } from "./password.schema";
import { otpSchema } from "./otp.schema";
import { pageNumberRegex } from "../utils";
import { errorMessage } from "../constants";



export const createUserSchema = z
    .object({
        username: z
            .string({ message: errorMessage.USERNAME_REQUIRED })
            .min(5, errorMessage.USERNAME_MIN_LENGTH),
        email: z
            .string({ message: errorMessage.EMAIL_REQUIRED })
            .email({ message: errorMessage.INVALID_EMAIL_FORMAT }),
        phone: phoneSchema,
        role: z
            .string()
    })
    .strict({ message: errorMessage.ROLE_REQUIRED });



export const userAuthSchema = z
    .object({
        email: z
            .string({ message: errorMessage.EMAIL_REQUIRED })
            .email({ message: errorMessage.INVALID_EMAIL_FORMAT }),
        password: passwordSchema,
    })
    .strict();



export const userOtpValidationSchema = z.object({
    email: z.string({ message: errorMessage.EMAIL_REQUIRED }).email({ message: errorMessage.INVALID_EMAIL_FORMAT }),
    otp: otpSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
}).strict().refine(
    (data) => data.password === data.confirmPassword,
    {
        message: errorMessage.PASSWORDS_MUST_MATCH,
        path: ["confirmPassword"],
    }
);
export const forgotPasswordSchema = z.object({
    email: z.string({ message: errorMessage.EMAIL_REQUIRED }).email({ message: errorMessage.INVALID_EMAIL_FORMAT })
});

export const resetPasswordSchema = z
    .object({
        email: z
            .string({ message: errorMessage.EMAIL_REQUIRED })
            .email({ message: errorMessage.INVALID_EMAIL_FORMAT }),
        otp: otpSchema,
        password: passwordSchema
    })
    .strict()



export const updateUserSchema = z
    .object({
        username: z
            .string()
            .min(5, errorMessage.USERNAME_MIN_LENGTH)
            .optional(),
        email: z
            .string({ message: errorMessage.EMAIL_REQUIRED })
            .email({ message: errorMessage.INVALID_EMAIL_FORMAT })
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
        { message: errorMessage.AT_LEAST_ONE_FIELD_REQUIRED_FOR_UPDATE }
    );



export const userFilterQuerySchema = z
    .object({
        pageNo: z.string({ message: errorMessage.PAGE_NUMBER_REQUIRED }).regex(pageNumberRegex, errorMessage.PAGE_NUMBER_MUST_BE_DIGITS),
        pageLimit: z.string({ message: errorMessage.PAGE_LIMIT_REQUIRED }).regex(pageNumberRegex, errorMessage.PAGE_LIMIT_MUST_BE_DIGITS),
        role: z.string().optional(),
        sortKey: z.nativeEnum(UserSortKeys, { message: errorMessage.INVALID_SORT_KEY }).optional()
    })
    .strict();



export const userSearchFilterQuerySchema = z
    .object({
        pageNo: z.string({ message: errorMessage.PAGE_NUMBER_REQUIRED }).regex(pageNumberRegex, errorMessage.PAGE_NUMBER_MUST_BE_DIGITS),
        pageLimit: z.string({ message: errorMessage.PAGE_LIMIT_REQUIRED }).regex(pageNumberRegex, errorMessage.PAGE_LIMIT_MUST_BE_DIGITS),
        role: z.string().optional(),
        sortKey: z.nativeEnum(UserSortKeys, { message: errorMessage.INVALID_SORT_KEY }).optional(),
        username: z.string().optional()
    })