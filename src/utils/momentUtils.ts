import moment from 'moment-timezone';
import { DateRange, TimeInHHMM, YYYYMMDD } from "../types";
import { logger } from './logger';
import { DateStatus } from '../enums';


/**
 * Function to get the current timestamp in ISO format
 */
export const getTimeStamp = (): string => {
    return moment().toISOString();
}


/**
 * Parses the given date and time strings into an ISO 8601 string format using Moment.js.
 */
export const getDateFromInput = (dateString: YYYYMMDD, timeString: TimeInHHMM, timeZone: string): string => {
    if (!moment(dateString, 'YYYY-MM-DD', true).isValid()) {
        throw new Error("Invalid date format. Expected format: YYYY-MM-DD.");
    }

    if (!moment(timeString, 'HH:mm', true).isValid()) {
        throw new Error("Invalid time format. Expected format: HH:mm.");
    }

    if (!moment.tz.zone(timeZone)) {
        throw new Error("Invalid timezone format.");
    }

    const dateTimeString = `${dateString}T${timeString}`;

    const dateTimeInUtc = moment.tz(dateTimeString, 'YYYY-MM-DDTHH:mm', timeZone).utc();

    return dateTimeInUtc.toISOString();
}


/**
 * Returns the start and end of the given day as a range in ISO 8601 string format.
 */
export const getDayRange = (isoDateString: string): DateRange => {

    const date = moment(isoDateString);

    if (!date.isValid()) {
        throw new Error("Invalid date provided.");
    }

    const startOfDay = date.startOf('day').toISOString();
    const endOfDay = date.endOf('day').toISOString();

    return [startOfDay, endOfDay];
}


/**
 * Calculate the date range based on the provided arguments.
 * @param {string} rangeStartDate - The start date of the range in YYYY-MM-DD format.
 * @param {string} rangeEndDate - The end date of the range in YYYY-MM-DD format.
 * @returns {DateRange} - An array containing `startDate` and `endDate` as ISOString elements
 */
export const getDateRange = (rangeStartDate: string, rangeEndDate: string): DateRange => {

    const startDate = moment(rangeStartDate);
    const endDate = moment(rangeEndDate);

    if (!startDate.isValid() || !endDate.isValid()) {
        throw new Error("Invalid rangeStartDate or rangeEndDate provided.");
    }

    if (startDate.isAfter(endDate)) {
        throw new Error("rangeStartDate cannot be after rangeEndDate.");
    }

    return [startDate.toISOString(), endDate.toISOString()];

}


/**
 * To edit Hours and Minutes in Date and return date in ISO string format 
 */
export const updateHoursAndMinutesInISODate = (isoDateString: string, timeString: TimeInHHMM): string => {
    logger.info(isoDateString)
    if (!moment(isoDateString, moment.ISO_8601, true).isValid()) {
        throw new Error("Invalid date format. Expected an ISO string.");
    }

    if (!moment(timeString, 'HH:mm', true).isValid()) {
        throw new Error("Invalid time format. Expected format: HH:MM.");
    }

    const updatedMoment = moment(isoDateString).utc().set({
        hour: Number(timeString.split(':')[0]),
        minute: Number(timeString.split(':')[1]),
        second: 0,
        millisecond: 0,
    });

    return updatedMoment.toISOString();
};

/**
 * To convert a date string in ISO Format
*/
export const convertToISOString = (string: string): string => {
    const time = moment(string);
    if (!time.isValid()) throw new Error('! inValid date string');

    return time.toISOString();
}


export const compareDatesWithCurrentDate = (inputDate: string): DateStatus => {
    
    const normalizedCurrentDate = moment().startOf("day");
    const normalizedComparisonDate = moment(inputDate, "YYYY-MM-DD").startOf("day");

    if (normalizedComparisonDate.isBefore(normalizedCurrentDate)) {
        return DateStatus.Past;
    } else if (normalizedComparisonDate.isAfter(normalizedCurrentDate)) {
        return DateStatus.Future;
    } else {
        return DateStatus.Present;
    }
};