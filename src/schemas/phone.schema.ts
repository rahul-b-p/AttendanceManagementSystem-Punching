import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

export const phoneSchema = z.string({ message:"Phone number is required."}).refine(
    (phone) => isValidPhoneNumber(phone),
    { message: 'Invalid phone number format' }
);