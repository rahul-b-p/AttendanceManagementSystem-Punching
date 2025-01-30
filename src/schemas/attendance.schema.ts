import { z } from "zod";
import { HHMMSchema, YYYYMMDDSchema } from "./date.schema";
import { objectIdRegex, pageNumberRegex } from "../utils";
import { AttendanceSortKeys, Days } from "../enums";
import { errorMessage } from "../constants";



const commaSeparatedDaysSchema = z.string().refine((val) => {
    const daysArray = val.split(',');
    const validDays = Object.values(Days);
    return daysArray.every(day => validDays.includes(day as Days));
}, {
    message: errorMessage.INVALID_DAYS_PROVIDED
});


export const attendnacePunchSchema = z.object({
    latitude: z.number({ message: errorMessage.LATITUDE_REQUIRED }),
    longitude: z.number({ message: errorMessage.LONGITUDE_REQUIRED })
}).strict();


export const createAttendanceSchema = z.object({
    latitude: z.number({ message: errorMessage.LATITUDE_REQUIRED }),
    longitude: z.number({ message: errorMessage.LONGITUDE_REQUIRED }),
    date: YYYYMMDDSchema,
    punchInTime: HHMMSchema,
    punchOutTime: HHMMSchema
}).strict()
    .refine(data =>
        data.punchInTime < data.punchOutTime,
        { message: errorMessage.PUNCH_IN_BEFORE_PUNCH_OUT }
    );


export const updateAttendanceSchema = z.object({
    latitude: z.number({ message: errorMessage.LATITUDE_REQUIRED }).optional(),
    longitude: z.number({ message: errorMessage.LONGITUDE_REQUIRED }).optional(),
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
        message: errorMessage.AT_LEAST_REQUIRED_ARTTENDACE_CREATION,
        path: ['date']
    });


export const attendnaceFilterQuerySchema = z.object({
    pageNo: z.string({ message: errorMessage.PAGE_NUMBER_REQUIRED }).regex(pageNumberRegex, errorMessage.PAGE_NUMBER_MUST_BE_DIGITS),
    pageLimit: z.string({ message: errorMessage.PAGE_LIMIT_REQUIRED }).regex(pageNumberRegex, errorMessage.PAGE_NUMBER_MUST_BE_DIGITS),
    date: YYYYMMDDSchema.optional(),
    userId: z.string().regex(objectIdRegex, { message: errorMessage.INVALID_ID }).optional(),
    startDate: YYYYMMDDSchema.optional(),
    endDate: YYYYMMDDSchema.optional(),
    days: commaSeparatedDaysSchema.optional(),
    officeId: z.string().regex(objectIdRegex, { message: errorMessage.INVALID_ID }).optional(),
    sortKey: z.nativeEnum(AttendanceSortKeys, { message: errorMessage.INVALID_SORT_KEY }).optional()
}).strict()
    .refine(
        (data) =>
            !(data.date && (data.startDate || data.endDate || data.days)),
        {
            message: errorMessage.CONFLICTING_ATTENDANCE_FILTER_PARAMETERS,
            path: ["date"],
        }
    )
    .refine((data) => !data.startDate || data.endDate, {
        message: errorMessage.INSUFFICIENT_FEILDS_ON_DATE_RANGE,
        path: ["startDate"],
    }).refine((data) => {
        if (data.startDate && data.endDate) {
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            return startDate <= endDate;
        }
        return true;
    }, {
        message: errorMessage.INVALID_DATE_RANGE,
        path: ["startDate"],
    });


export const attendnaceSummaryQuerySchema = z.object({
    userId: z.string().regex(objectIdRegex, { message: errorMessage.INVALID_ID }),
    startDate: YYYYMMDDSchema,
    endDate: YYYYMMDDSchema
}).strict().refine((data) => {
    if (data.startDate && data.endDate) {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        return startDate <= endDate;
    }
    return true;
}, {
    message: errorMessage.INVALID_DATE_RANGE,
    path: ["startDate"],
});