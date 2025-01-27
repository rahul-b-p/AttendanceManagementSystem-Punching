import { Types } from "mongoose";
import { AttendanceQuery } from "../types";
import { getDateRange, getDayRange } from "./momentUtils";
import { logger } from "./logger";
import { getDayNumber } from "./dayUtils";
import { Days } from "../enums";

/**
 * Prepare the match filter for the aggregation pipeline.
 */
export const prepareMatchFilter = (query: AttendanceQuery): Record<string, any> => {
    const { date, officeId, userId, days, endDate, startDate } = query;
    const matchFilter: Record<string, any> = {};

    // Date range filter
    if (date && (startDate || endDate)) throw new Error("single date and date range filter can't be applied together");
    else if ((startDate && !endDate) || (endDate && !startDate)) throw new Error('should start and end dates are required to calculate daterange')
    else if (date) {
        const dayRange = getDayRange(date);
        matchFilter["punchIn"] = { $gte: dayRange[0], $lte: dayRange[1] };
    }
    else if (startDate && endDate) {
        const dateRange = getDateRange(startDate, endDate);
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
        const daysArray = days.split(',') as Days[];
        
        const dayNumbers = getDayNumber(daysArray);
        matchFilter["dayOfWeekName"] = { $in: dayNumbers };
    }

    return matchFilter;
};


/**
 * Prepare a new feild "dayOfWeekName" to add on the doccument while the aggregation pipeline.
 */
export const prepareAddFeilds = (query: AttendanceQuery): Record<string, any> => {
    const { days } = query;

    const addFeilds: Record<string, any> = {};

    if (days) {
        addFeilds["dayOfWeekName"] = { $dayOfWeek: { $toDate: "$punchIn" } }
    }

    logger.info(addFeilds)
    return addFeilds;
}