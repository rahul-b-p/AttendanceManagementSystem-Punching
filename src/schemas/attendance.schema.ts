import { z } from "zod";




export const punchInSchema = z.object({
    latitude: z.number({ message: "latitude required" }),
    longitude: z.number({ message: "longitude required" })
}).strict();