import { z } from "zod";
import { passwordRegex } from "../utils";

export const passwordSchema = z.string({ message: "Password is required." }).refine(
    (password) => passwordRegex.test(password),
    {
        message: 'Password must be at least 8 characters long and include at least one letter, one number, and one special character.',
    }
);