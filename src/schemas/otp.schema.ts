import { z } from "zod";
import { otpRegex } from "../utils";
import { errorMessage } from "../constants";


export const otpSchema = z.string().regex(otpRegex, {
    message: errorMessage.INVALID_OTP_FORMAT,
});