import { z } from "zod";
import { objectIdRegex, pageNumberRegex } from "../utils";
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



export const updateOfficeSchema = z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    officeName: z.string().optional(),
    radius: z.number().optional(),
}).strict()
    .superRefine((data, ctx) => {
        const addressFields: (keyof typeof data)[] = ["street", "city", "state", "zip_code"];
        const locationFields: (keyof typeof data)[] = ["latitude", "longitude"];

        const isAddressChanged = addressFields.some((field) => field in data && data[field] !== undefined);
        const isLocationChanged = locationFields.some((field) => field in data && data[field] !== undefined);

        if (isAddressChanged && (!data.latitude || !data.longitude)) {
            ctx.addIssue({
                code: "custom",
                message: "Latitude and longitude must be provided when any address field is updated (street, city, state, or zip_code).",
                path: ["latitude", "longitude"],
            });
        }

        if (isLocationChanged && (!data.street && !data.city && !data.state && !data.zip_code)) {
            ctx.addIssue({
                code: "custom",
                message: "Address fields (street, city, state, zip_code) must be updated when location (latitude or longitude) is modified.",
                path: ["street", "city", "state", "zip_code"],
            });
        }
    })
    .refine(
        (data) =>
            data.officeName ||
            data.street ||
            data.city ||
            data.state ||
            data.zip_code ||
            data.latitude ||
            data.longitude ||
            data.radius,
        {
            message: "At least one field is required for update.",
        }
    );



export const officeUserActionSchema = z.object({
    manager: z.string().regex(objectIdRegex, "Invalid ObjectId").optional(),
    employee: z.string().regex(objectIdRegex, "Invalid ObjectId").optional()
}).strict()
    .refine(data =>
        data.employee || data.manager,
        { message: "any of the field should be require to assign a user in office" }
    );