import moment from 'moment-timezone';
import { DateRange, Location, TimeInHHMM, YYYYMMDD } from "../types";
import { logFunctionInfo } from './logger';
import { DateStatus, FunctionStatus } from '../enums';
import { errorMessage } from '../constants';
import { getTimeZoneOfLocation } from './timezone';


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
    logFunctionInfo('getDateFromInput', FunctionStatus.start);

    if (!moment(dateString, 'YYYY-MM-DD', true).isValid()) {
        throw new Error(errorMessage.INVALID_DATE_FORMAT);
    }

    if (!moment(timeString, 'HH:mm', true).isValid()) {
        throw new Error(errorMessage.INVALID_TIME_INPUT);
    }

    if (!moment.tz.zone(timeZone)) {
        throw new Error(errorMessage.INVALID_TIMEZONE);
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
        throw new Error(errorMessage.INVALID_DATE_ISO);
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
        throw new Error(errorMessage.INVALID_DATE_FORMAT);
    }

    if (startDate.isAfter(endDate)) {
        throw new Error(errorMessage.INVALID_DATE_RANGE);
    }

    return [startDate.toISOString(), endDate.toISOString()];

}


/**
 * To edit Hours and Minutes in Date and return date in ISO string format 
 */
export const updateHoursAndMinutesInISODate = (isoDateString: string, timeString: TimeInHHMM, location: Location): string => {
    logFunctionInfo("updateHoursAndMinutesInISODate", FunctionStatus.start);

    // Validate ISO date string
    if (!moment(isoDateString, moment.ISO_8601, true).isValid()) {
        throw new Error(errorMessage.INVALID_DATE_ISO);
    }

    // Validate time string
    if (!moment(timeString, 'HH:mm', true).isValid()) {
        throw new Error(errorMessage.INVALID_TIME_INPUT);
    }

    // Parse hours and minutes from local time
    const [hours, minutes] = timeString.split(':').map(Number);

    // Create a moment object from the UTC ISO string and convert to the location's timezone
    const momentInUTC = moment(isoDateString);

    // Get timezone offset for the given coordinates
    const tzOffset = getTimeZoneOfLocation(location);

    // Apply the timezone offset
    const localMoment = momentInUTC.clone().add(tzOffset, 'minutes');

    // Set the local time components
    localMoment.set({
        hour: hours,
        minute: minutes,
        second: 0,
        millisecond: 0
    });

    // Convert back to UTC
    return localMoment.subtract(tzOffset, 'minutes').toISOString();
};



/**
 * To convert a date string in ISO Format
*/
export const convertToISOString = (string: string): string => {
    const time = moment(string);
    if (!time.isValid()) throw new Error(errorMessage.INVALID_DATE_AS_DATE);

    return time.toISOString();
}

/**
 * To compare inputed date with current date
 * @returns the status as `past`, `present` or `future`
*/
export const compareDatesWithCurrentDate = (inputDate: string): DateStatus => {
    logFunctionInfo('compareDatesWithCurrentDate', FunctionStatus.start);

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