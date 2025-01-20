import { z } from "zod";
import { pageNumberRegex } from "../utils";
import { OfficeSortKeys } from "../enums";




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


export const officeFilterQuerySchema = z.object({
    pageNo: z.string({ message: "Page number is required" }).regex(pageNumberRegex, "Page number should be provide in digits"),
    pageLimit: z.string({ message: "Page limit is required" }).regex(pageNumberRegex, "Page limit should be provide in digits"),
    city: z.string().optional(),
    state: z.string().optional(),
    sortKey: z.nativeEnum(OfficeSortKeys, { message: "sort keys should be 'createAt' or 'username'" }).optional()
}).strict();