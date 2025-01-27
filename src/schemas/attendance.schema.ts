import { z } from "zod";
import { HHMMSchema, YYYYMMDDSchema } from "./date.schema";
import { objectIdRegex, pageNumberRegex } from "../utils";
import { AttendanceSortKeys, Days } from "../enums";



const commaSeparatedDaysSchema = z.string().refine((val) => {
    const daysArray = val.split(',');
    const validDays = Object.values(Days);
    return daysArray.every(day => validDays.includes(day as Days));
}, {
    message: "Invalid days provided. Ensure all days are valid Days enum values and comma-separated."
});


export const attendnacePunchSchema = z.object({
    latitude: z.number({ message: "latitude required" }),
    longitude: z.number({ message: "longitude required" })
}).strict();


export const createAttendanceSchema = z.object({
    latitude: z.number({ message: "latitude required" }),
    longitude: z.number({ message: "longitude required" }),
    date: YYYYMMDDSchema,
    punchInTime: HHMMSchema,
    punchOutTime: HHMMSchema
}).strict()
    .refine(data =>
        data.punchInTime < data.punchOutTime,
        { message: "punch in time should before the punch out time" }
    );


export const updateAttendanceSchema = z.object({
    latitude: z.number({ message: "latitude required" }).optional(),
    longitude: z.number({ message: "longitude required" }).optional(),
    date: YYYYMMDDSchema.optional(),
    punchInTime: HHMMSchema.optional(),
    punchOutTime: HHMMSchema.optional()
}).strict()
    .refine(data => {
        const atLeastOneFieldProvided = data.latitude !== undefined || data.longitude !== undefined
            || data.date !== undefined || data.punchInTime !== undefined || data.punchOutTime !== undefined;

        const punchTimesRequiredWithDate = data.date !== undefined
            ? (data.punchInTime !== undefined && data.punchOutTime !== undefined)
            : true;

        return atLeastOneFieldProvided && punchTimesRequiredWithDate;
    }, {
        message: "At least one field is required. If date is provided, both punchInTime and punchOutTime must be provided.",
        path: ['date']
    });


export const attendnaceFilterQuerySchema = z.object({
    pageNo: z.string({ message: "Page number is required" }).regex(pageNumberRegex, "Page number should be provided in digits"),
    pageLimit: z.string({ message: "Page limit is required" }).regex(pageNumberRegex, "Page limit should be provided in digits"),
    date: YYYYMMDDSchema.optional(),
    userId: z.string().regex(objectIdRegex, { message: "Invalid userId" }).optional(),
    startDate: YYYYMMDDSchema.optional(),
    endDate: YYYYMMDDSchema.optional(),
    days: commaSeparatedDaysSchema.optional(),
    officeId: z.string().regex(objectIdRegex, { message: "Invalid officeId" }).optional(),
    sortKey: z.nativeEnum(AttendanceSortKeys, { message: "Invalid sortKey" }).optional()
}).strict()
    .refine(
        (data) =>
            !(data.date && (data.startDate || data.endDate || data.days)),
        {
            message: "You cannot provide startDate, endDate, or days along with date",
            path: ["date"],
        }
    )
    .refine((data) => !data.startDate || data.endDate, {
        message: "endDate must be provided if startDate is provided",
        path: ["startDate"],
    }).refine((data) => {
        if (data.startDate && data.endDate) {
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            return startDate <= endDate;
        }
        return true;
    }, {
        message: "startDate must be less than or equal to endDate",
        path: ["startDate"],
    });


export const attendnaceSummaryQuerySchema = z.object({
    userId: z.string().regex(objectIdRegex, { message: "Invalid userId" }),
    startDate: YYYYMMDDSchema,
    endDate: YYYYMMDDSchema
}).strict();