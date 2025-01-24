import { BadRequestError } from "../errors";
import { AttendanceQuery } from "../types";


/**
 * Validates the provided attendance query.
 * 
 * @param query - The attendance query object containing date, startDate, endDate, and days.
 * @throws {BadRequestError} - If the validation rules are violated.
 */
export const validateAttendanceQuery = (query: AttendanceQuery): void => {
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