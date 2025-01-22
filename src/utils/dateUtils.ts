import { DateStatus } from "../enums";
import { TimeInHHMM, YYYYMMDD } from "../types";
import { logger } from "./logger";
import { HHMMregex, YYYYMMDDregex } from "./regex";

export const compareDates = (inputDate: string): DateStatus => {

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
