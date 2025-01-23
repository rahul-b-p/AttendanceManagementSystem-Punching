import { z } from "zod";
import { HHMMSchema, YYYYMMDDSchema } from "./date.schema";
import { objectIdRegex, pageNumberRegex } from "../utils";
import { AttendanceSortKeys } from "../enums";




export const punchInSchema = z.object({
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
    pageNo: z.string({ message: "Page number is required" }).regex(pageNumberRegex, "Page number should be provide in digits"),
    pageLimit: z.string({ message: "Page limit is required" }).regex(pageNumberRegex, "Page limit should be provide in digits"),
    date: YYYYMMDDSchema.optional(),
    userId: z.string().regex(objectIdRegex, { message: "Invalid userId" }).optional(),
    officeId: z.string().regex(objectIdRegex, { message: "Invalid officeId" }).optional(),
    sortKey: z.nativeEnum(AttendanceSortKeys, { message: "Invalid sortKey" }).optional()
}).strict();