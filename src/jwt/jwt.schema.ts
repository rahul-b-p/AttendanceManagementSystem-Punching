import { z } from "zod";
import { secretKeyRegex } from "../utils";



export const secretKeySchema = z
    .string()
    .min(16, "Secret key must be at least 16 characters long")
    .max(64, "Secret key can be up to 64 characters long")
    .regex(secretKeyRegex, "Secret key must combination of alphabets and integers");