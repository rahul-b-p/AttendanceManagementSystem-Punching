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