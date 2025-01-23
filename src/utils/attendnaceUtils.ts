import { Types } from "mongoose";
import { Days } from "../enums";
import { AttendanceQuery } from "../types";
import { calculateDateRange } from "./dateUtils";

/**
 * Prepare the match filter for the aggregation pipeline.
 */
export const prepareMatchFilter = (query: AttendanceQuery): Record<string, any> => {
    const { date, officeId, userId, days, endDate, startDate } = query;
    const matchFilter: Record<string, any> = {};

    // Date range filter
    const dateRange = calculateDateRange(date, startDate, endDate);
    if (dateRange) {
        matchFilter["punchIn"] = { $gte: dateRange[0], $lte: dateRange[1] };
    }

    // User ID filter
    if (userId) {
        matchFilter["userId"] = new Types.ObjectId(userId);
    }

    // Office ID filter
    if (officeId) {
        matchFilter["officeId"] = new Types.ObjectId(officeId);
    }

    // Day filter
    if (days) {
        matchFilter["dayOfWeekName"] = days;
    }

    return matchFilter;
};


/**
 * Prepare a new feild "dayOfWeekName" to add on the doccument while the aggregation pipeline.
 */
export const prepareAddFeilds = (query: AttendanceQuery): Record<string, any> => {
    const { days } = query;
    const dayMap = Object.values(Days);

    const addFeilds: Record<string, any> = {};

    if (days) {
        addFeilds["dayOfWeekName"] = {
            $arrayElemAt: [dayMap, { $subtract: [{ $dayOfWeek: "$punchIn" }, 1] }],
        }
    }

    return addFeilds;
}