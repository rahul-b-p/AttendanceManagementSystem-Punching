import { DateStatus } from "../enums";
import { DateRange, TimeInHHMM, YYYYMMDD } from "../types";
import { HHMMregex, YYYYMMDDregex } from "./regex";



/**
 * Compares inputed date with current date
 * @returns {DateStatus} `past`, `present` or `futue` according to the comparison result
 */
export const compareDatesWithCurrentDate = (inputDate: string): DateStatus => {

    const currentDate = new Date();
    const comparisonDate = new Date(inputDate);

    const normalizedCurrentDate = new Date(currentDate.toISOString().substring(0, 10));
    const normalizedComparisonDate = new Date(comparisonDate.toISOString().substring(0, 10));

    if (normalizedComparisonDate < normalizedCurrentDate) {
        return DateStatus.Past;
    } else if (normalizedComparisonDate > normalizedCurrentDate) {
        return DateStatus.Future;
    } else {
        return DateStatus.Present;
    }
}


/**
 * Gets a Date object from the input date and time strings.
 * @returns {Date} -returns in Date object format
 */
export const getDateFromInput = (dateString: YYYYMMDD, timeString: TimeInHHMM): Date => {
    if (!YYYYMMDDregex.test(dateString)) {
        throw new Error("Invalid date format. Expected format: YYYY-MM-DD.");
    }
    if (!HHMMregex.test(timeString)) {
        throw new Error("Invalid time format. Expected format: HH:MM.");
    }

    const dateTimeString = `${dateString}T${timeString}:00Z`;

    return new Date(dateTimeString);
}


/**
 * Update time on given Date
 * @param {Date} date 
 * @param {TimeInHHMM} timeString - in HH:MM format
 */
export const updateHoursAndMinutesInDate = (date: Date, timeString: TimeInHHMM): Date => {

    if (!HHMMregex.test(timeString)) {
        throw new Error("Invalid time format. Expected format: HH:MM.");
    }

    const [newHours, newMinutes] = timeString.split(':').map(Number);

    date.setUTCHours(newHours, newMinutes);
    return date;
}


/**
 * Calculate the date range based on the provided arguments.
 * @param {string} singleDate - A single date in YYYY-MM-DD format (optional).
 * @param {string} rangeStartDate - The start date of the range in YYYY-MM-DD format (optional).
 * @param {string} rangeEndDate - The end date of the range in YYYY-MM-DD format (optional).
 * @returns {DateRange|null} - An array containing `startDate` and `endDate` as Date elements,return null if no arguments provided
 * @throws {Error} - Throws an error if arguments are invalid.
 */
export const calculateDateRange = (singleDate?: string, rangeStartDate?: string, rangeEndDate?: string): DateRange | null => {
    if (singleDate && (rangeStartDate || rangeEndDate)) {
        throw new Error("You cannot provide startDate, endDate, or days along with date.");
    }

    if (rangeStartDate && !rangeEndDate) {
        throw new Error("endDate must be provided if startDate is provided.");
    }

    if (singleDate) {
        const date = new Date(singleDate);
        if (isNaN(date.getTime())) {
            throw new Error("Invalid singleDate provided.");
        }

        const startOfDay = new Date(date.setHours(0, 0, 0, 0)); // Start of the day
        const endOfDay = new Date(date.setHours(23, 59, 59, 999)); // End of the day

        return [startOfDay, endOfDay];
    }
    else if (rangeStartDate && rangeEndDate) {
        const startDate = new Date(rangeStartDate);
        const endDate = new Date(rangeEndDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error("Invalid rangeStartDate or rangeEndDate provided.");
        }

        if (startDate > endDate) {
            throw new Error("rangeStartDate cannot be after rangeEndDate.");
        }

        return [startDate, endDate];
    }
    else return null;
}
