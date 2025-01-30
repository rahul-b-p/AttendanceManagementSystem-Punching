import { z } from "zod";
import { HHMMregex, YYYYMMDDregex } from "../utils";
import { errorMessage } from "../constants";



export const YYYYMMDDSchema = z.string({
    message: errorMessage.DATE_IS_REQUIRED,
}).regex(
    YYYYMMDDregex,
    errorMessage.INVALID_DATE_FORMAT
).refine((dateStr) => {
    const [year, month, day] = dateStr.split("-").map(Number);

    const date = new Date(year, month - 1, day);
    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}, "Invalid date").transform((dateStr) => {
    return dateStr;
});

export const HHMMSchema = z.string(({
    message: errorMessage.PUNCH_IN_OUT_TIME_REQUIRED
})).regex(HHMMregex, {
    message: errorMessage.INVALID_TIME_INPUT
});