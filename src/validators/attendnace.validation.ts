import { errorMessage } from "../constants";
import { FunctionStatus } from "../enums";
import { BadRequestError } from "../errors";
import { AttendanceQuery } from "../types";
import { logFunctionInfo } from "../utils";


/**
 * Validates the provided attendance query.
 * 
 * @param query - The attendance query object containing date, startDate, endDate, and days.
 * @throws {BadRequestError} - If the validation rules are violated.
 */
export const validateAttendanceQuery = (query: AttendanceQuery): void => {
    logFunctionInfo("validateAttendanceQuery", FunctionStatus.start);

    const { date, startDate, endDate, days } = query;

    if (date && (startDate || endDate || days)) {
        throw new BadRequestError(
            errorMessage.CONFLICTING_ATTENDANCE_FILTER_PARAMETERS
        );
    }

    if (startDate && !endDate) {
        throw new BadRequestError(errorMessage.INSUFFICIENT_FEILDS_ON_DATE_RANGE);
    }
};