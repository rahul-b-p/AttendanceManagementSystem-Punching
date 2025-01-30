import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";
import { errorMessage } from "../constants";

export const phoneSchema = z.string({ message: "Phone number is required." }).refine(
    (phone) => isValidPhoneNumber(phone),
    { message: errorMessage.INVALID_PHONE_NUMBER_FORMAT }
);