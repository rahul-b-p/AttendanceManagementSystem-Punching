import { z } from "zod";
import { otpRegex } from "../utils";


export const otpSchema = z.string().regex(otpRegex, {
    message: "OTP must be a 6-digit number.",
});