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
            "You cannot provide startDate, endDate, or days along with date."
        );
    }

    if (startDate && !endDate) {
        throw new BadRequestError("endDate must be provided if startDate is provided.");
    }
};