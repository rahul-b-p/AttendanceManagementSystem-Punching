import { z } from "zod";
import { pageNumberRegex } from "../utils";
import { OfficeSortKeys } from "../enums";
import { errorMessage } from "../constants";




export const createOfficeSchema = z.object({
    officeName: z.string({ message: errorMessage.OFFICE_NAME_REQUIRED }),
    street: z.string({ message: errorMessage.STREET_REQUIRED }),
    city: z.string({ message: errorMessage.CITY_REQUIRED }),
    state: z.string({ message: errorMessage.STATE_REQUIRED }),
    zip_code: z.string({ message: errorMessage.ZIP_CODE_REQUIRED }),
    latitude: z.number({ message: errorMessage.LATITUDE_REQUIRED }),
    longitude: z.number({ message: errorMessage.LONGITUDE_REQUIRED }),
    radius: z.number({ message: errorMessage.RADIUS_REQUIRED })
}).strict();


export const officeFilterQuerySchema = z.object({
    pageNo: z.string({ message: errorMessage.PAGE_NUMBER_REQUIRED }).regex(pageNumberRegex, errorMessage.PAGE_NUMBER_MUST_BE_DIGITS),
    pageLimit: z.string({ message: errorMessage.PAGE_LIMIT_REQUIRED }).regex(pageNumberRegex, errorMessage.PAGE_LIMIT_MUST_BE_DIGITS),
    city: z.string().optional(),
    state: z.string().optional(),
    sortKey: z.nativeEnum(OfficeSortKeys, { message: errorMessage.INVALID_SORT_KEY }).optional(),
    officeName: z.string({ message: errorMessage.INVALID_SEARCH_KEY }).optional()
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
                message: errorMessage.LAT_LONG_REQUIRED_FOR_ADDRESS_UPDATE,
                path: ["latitude", "longitude"],
            });
        }

        if (isLocationChanged && (!data.street && !data.city && !data.state && !data.zip_code)) {
            ctx.addIssue({
                code: "custom",
                message: errorMessage.ADDRESS_FIELDS_REQUIRED_FOR_LOCATION_UPDATE,
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
            message: errorMessage.AT_LEAST_ONE_FIELD_REQUIRED_FOR_UPDATE,
        }
    );

