import { z } from "zod";
import { passwordRegex } from "../utils";
import { errorMessage } from "../constants";

export const passwordSchema = z.string({ message: "Password is required." }).refine(
    (password) => passwordRegex.test(password),
    {
        message: errorMessage.INVALID_PASSWORD_FORMAT,
    }
);