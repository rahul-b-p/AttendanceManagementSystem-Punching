import { z } from "zod";




export const createOfficeSchema = z.object({
    officeName: z.string({ message: "officeName is required" }),
    street: z.string({ message: "street is required" }),
    city: z.string({ message: "city is required" }),
    state: z.string({ message: "state is required" }),
    zip_code: z.string({ message: "zip code is required" }),
    latitude: z.number({ message: "latitude required" }),
    longitude: z.number({ message: "longitude required" }),
    radius: z.number({ message: "radius required and should be calculated in meters" })
}).strict();