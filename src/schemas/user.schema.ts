import { z } from "zod";
import { Roles } from "../enums";
import { phoneSchema } from "./phone.schema";
import { passwordSchema } from "./password.schema";
import { otpSchema } from "./otp.schema";



export const createUserSchema = z.object({
    username: z.string({ message: "Username is required." }).min(5, "Username must be at least 5 characters long"),
    email: z.string({ message: "Email is required." }).email({ message: "Invalid Email Format" }),
    phone: phoneSchema,
    password: passwordSchema,
    role: z.nativeEnum(Roles, { message: "role should be 'admin', 'manager' or 'employee'" })
}).strict();


export const userAuthSchema = z.object({
    email: z.string({ message: "Email is required." }).email({ message: "Invalid Email Format" }),
    password: passwordSchema,
}).strict('Invalid Request Body');


export const userOtpValidationSchema = z.object({
    email: z.string({ message: "Email is required." }).email({ message: "Invalid Email Format" }),
    otp: otpSchema
}).strict();

export const forgotPasswordSchema = z.object({
    email: z.string({ message: "Email is required." }).email({ message: "Invalid Email Format" })
});

export const resetPasswordSchema = z.object({
    email: z.string({ message: "Email is required." }).email({ message: "Invalid Email Format" }),
    otp: otpSchema,
    password: passwordSchema
})