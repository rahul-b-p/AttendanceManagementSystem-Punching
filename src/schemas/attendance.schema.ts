import { z } from "zod";
import { HHMMSchema, YYYYMMDDSchema } from "./date.schema";




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
