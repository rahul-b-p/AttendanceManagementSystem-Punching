import { z } from "zod";
import { secretKeyRegex } from "../utils";
import { Unit } from "./jwt.type";

const validUnits = Object.values(Unit).flatMap((unit) => [
    unit,
    unit.toUpperCase(),
    unit.toLowerCase(),
]);

export const secretKeySchema = z
    .string()
    .min(16, "Secret key must be at least 16 characters long")
    .max(64, "Secret key can be up to 64 characters long")
    .regex(secretKeyRegex, "Secret key must combination of alphabets and integers");


export const expirationSchema = z.union([
    // Case 1: Numeric string only
    z.string().regex(/^\d+$/, "Must be a numeric string (e.g., '123')."),

    // Case 2: Number followed directly by a unit (no space)
    z.string().refine((val) => {
        const numericPart = val.match(/^\d+/)?.[0]; // Extract numeric prefix
        const unitPart = val.replace(numericPart || "", ""); // Extract remaining as unit
        return (
            numericPart !== undefined && // Ensure numeric part exists
            validUnits.includes(unitPart) // Ensure unit is valid
        );
    }, {
        message: "Must be a number followed immediately by a valid unit (e.g., '123Year').",
    }),

    // Case 3: Number followed by a space and a unit
    z.string().refine((val) => {
        const [numericPart, unitPart] = val.split(" "); // Split into two parts
        return (
            /^\d+$/.test(numericPart) && // Ensure numeric part is valid
            validUnits.includes(unitPart) // Ensure unit part is valid
        );
    }, {
        message: "Must be a number followed by a space and a valid unit (e.g., '123 Year').",
    }),
]);