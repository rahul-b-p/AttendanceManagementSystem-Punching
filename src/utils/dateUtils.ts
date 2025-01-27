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

