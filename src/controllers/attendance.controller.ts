import { NextFunction, Response } from "express";
import { customRequestWithPayload, IUser } from "../interfaces";
import { compareDatesWithCurrentDate, getAttendanceSortArgs, getDateFromInput, getTimeStamp, logFunctionInfo, pagenate, sendCustomResponse, updateHoursAndMinutesInISODate, } from "../utils";
import { AuthenticationError, BadRequestError, ConflictError, ForbiddenError, InternalServerError, NotFoundError } from "../errors";
import { checkPunchInForDay, comparePunchInPunchOut, deleteAttendnaceById, fetchAttendanceData, findAttendanceById, findAttendanceSummary, findOfficeById, findUserById, getAllOfficeLocationsAndRadius, getDefaultRoleFromUserRole, insertAttendance, isManagerAuthorizedForEmployee, updateAttendanceById } from "../services";
import { AttendanceFilterQuery, AttendancePunchinArgs, AttendanceQuery, AttendanceSummaryQuery, createAttendanceBody, Location, UpdateAttendanceArgs, updateAttendanceBody } from "../types";
import { DateStatus, FunctionStatus, Roles } from "../enums";
import { isValidObjectId, validateLocationWithinInstitutionRadius, validateLocationWithinMultipleInstitutionsRadius } from "../validators";
import { getTimeZoneOfLocation } from "../utils/timezone";
import { errorMessage, responseMessage } from "../constants";



/**
 * Controller function to handle the punch-in attendance request.
 */
export const punchInAttendance = async (req: customRequestWithPayload<{}, any, Location>, res: Response, next: NextFunction) => {
    const functionName = 'punchInAttendance';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const userId = req.payload?.id as string;
        const existingUser = await findUserById(userId);
        if (!existingUser) throw new AuthenticationError();

        const userRoleAsDefaultRole = await getDefaultRoleFromUserRole(existingUser.role);

        const requestedUserLocation = req.body;

        let officeId;

        if (userRoleAsDefaultRole !== Roles.admin) {
            if (!existingUser.officeId) throw new ForbiddenError(errorMessage.NO_OFFICE_ASSIGNMENT_PUNCH);

            const existingOffice = await findOfficeById(existingUser.officeId.toString());
            if (!existingOffice) throw new InternalServerError(errorMessage.DELETED_OFFICE_ID_STILL_ASSOCIATED);

            const isValidLocation = validateLocationWithinInstitutionRadius(requestedUserLocation, existingOffice.location, existingOffice.radius);
            if (!isValidLocation) throw new ForbiddenError(errorMessage.INVALID_ATTENDANCE_LOCATION);
            officeId = existingOffice._id.toString();
        }
        else {
            const availableOfficeLocationsWithRadius = await getAllOfficeLocationsAndRadius();
            if (!availableOfficeLocationsWithRadius) throw new ForbiddenError(errorMessage.NO_OFFICES_AVAILABLE_FOR_MARK_ATTENDANCE);
            const isValidLocation = validateLocationWithinMultipleInstitutionsRadius(requestedUserLocation, availableOfficeLocationsWithRadius);
            if (!isValidLocation) throw new ForbiddenError(errorMessage.INVALID_ATTENDANCE_LOCATION);
            officeId = isValidLocation.officeId;
        }

        const hasPunchIn = await checkPunchInForDay(userId);
        if (hasPunchIn) throw new ConflictError(errorMessage.ALREADY_PUNCHED_IN_TODAY);

        const newAttendance: AttendancePunchinArgs = {
            userId,
            officeId,
            location: req.body,
        }
        const addedAttendance = await insertAttendance(newAttendance);

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(201).json(await sendCustomResponse(responseMessage.ATTENDANCE_PUNCHED_IN, addedAttendance));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}


/**
 * Controller function to handle the punch-out attendance request.
 */
export const punchOutAttendance = async (req: customRequestWithPayload<{}, any, Location>, res: Response, next: NextFunction) => {
    const functionName = 'punchOutAttendance';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const userId = req.payload?.id as string;
        const existingUser = await findUserById(userId);
        if (!existingUser) throw new AuthenticationError();

        const userRoleAsDefaultRole = await getDefaultRoleFromUserRole(existingUser.role);

        const requestedUserLocation = req.body;

        if (userRoleAsDefaultRole !== Roles.admin) {
            if (!existingUser.officeId) throw new ForbiddenError(errorMessage.NO_OFFICE_ASSIGNMENT_PUNCH);

            const existingOffice = await findOfficeById(existingUser.officeId.toString());
            if (!existingOffice) throw Error(errorMessage.DELETED_OFFICE_ID_STILL_ASSOCIATED);

            const isValidLocation = validateLocationWithinInstitutionRadius(requestedUserLocation, existingOffice.location, existingOffice.radius);
            if (!isValidLocation) throw new ForbiddenError(errorMessage.INVALID_ATTENDANCE_LOCATION);
        }
        else {
            const availableOfficeLocationsWithRadius = await getAllOfficeLocationsAndRadius();
            if (!availableOfficeLocationsWithRadius) throw new ForbiddenError(errorMessage.NO_OFFICES_AVAILABLE_FOR_MARK_ATTENDANCE);
            const isValidLocation = validateLocationWithinMultipleInstitutionsRadius(requestedUserLocation, availableOfficeLocationsWithRadius);
            if (!isValidLocation) throw new ForbiddenError(errorMessage.INVALID_ATTENDANCE_LOCATION);
        }

        const hasPunchIn = await checkPunchInForDay(userId);
        if (!hasPunchIn) throw new ConflictError(errorMessage.PUNCH_IN_REQUIRED_BEFORE_PUNCH_OUT);

        if (hasPunchIn.punchOut) throw new ConflictError(errorMessage.ALREADY_PUNCHED_OUT_TODAY);

        const currentTimestamp = getTimeStamp();
        const updateBody: UpdateAttendanceArgs = { punchOut: currentTimestamp };

        const updatedAttendanceData = await updateAttendanceById(hasPunchIn._id.toString(), updateBody);
        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse(responseMessage.ATTENDANCE_PUNCHED_OUT, updatedAttendanceData));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}


/**
 * Controller function to handle the Attendnace Creation.
 * @protected - This is an admin-only feature.
 */
export const createAttendance = async (req: customRequestWithPayload<{ userId: string }, any, createAttendanceBody>, res: Response, next: NextFunction) => {
    const functionName = 'createAttendance';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { userId } = req.params;
        const isValidUserId = isValidObjectId(userId);
        if (!isValidUserId) throw new BadRequestError(errorMessage.INVALID_ID)

        const existingUser = await findUserById(userId);
        if (!existingUser) throw new NotFoundError(errorMessage.USER_NOT_FOUND);

        const existingUsersDefaultRole = await getDefaultRoleFromUserRole(existingUser.role);
        const { punchInTime, date, punchOutTime, ...location } = req.body;

        let officeId;
        let officeLocation;
        if (existingUsersDefaultRole !== Roles.admin) {
            if (!existingUser.officeId) throw new ForbiddenError(errorMessage.NO_OFFICE_ASSIGNMENT);

            const existingOffice = await findOfficeById(existingUser.officeId.toString());
            if (!existingOffice) throw Error(errorMessage.DELETED_OFFICE_ID_STILL_ASSOCIATED);

            const isValidLocation = validateLocationWithinInstitutionRadius(location, existingOffice.location, existingOffice.radius);
            if (!isValidLocation) throw new ForbiddenError(errorMessage.INVALID_ATTENDANCE_LOCATION);
            officeId = existingOffice._id.toString();
            officeLocation = existingOffice.location;
        }
        else {
            const availableOfficeLocationsWithRadius = await getAllOfficeLocationsAndRadius();
            if (!availableOfficeLocationsWithRadius) throw new ForbiddenError(errorMessage.NO_OFFICES_AVAILABLE_FOR_MARK_ATTENDANCE);
            const isValidLocation = validateLocationWithinMultipleInstitutionsRadius(location, availableOfficeLocationsWithRadius);
            if (!isValidLocation) throw new ForbiddenError(errorMessage.INVALID_ATTENDANCE_LOCATION);
            officeId = isValidLocation.officeId;

            const existingOffice = await findOfficeById(officeId);
            if (!existingOffice) throw new InternalServerError(errorMessage.ERROR_FETCHING_OFFICE_DATA);
            officeLocation = existingOffice.location;
        }

        const dateStatus = compareDatesWithCurrentDate(date);
        if (dateStatus == DateStatus.Future) throw new BadRequestError(errorMessage.CANNOT_MARK_FUTURE_ATTENDANCE);

        const officeTimeZone = getTimeZoneOfLocation(officeLocation);
        const punchIn = getDateFromInput(date, punchInTime, officeTimeZone);
        const hasPunchIn = await checkPunchInForDay(userId, punchIn);
        if (hasPunchIn) throw new ConflictError(errorMessage.USER_ALREADY_HAS_ATTENDANCE);

        const punchOut = getDateFromInput(date, punchOutTime, officeTimeZone);

        if (!comparePunchInPunchOut(punchIn, punchOut)) {
            throw new ConflictError(errorMessage.PUNCH_IN_BEFORE_PUNCH_OUT);
        }

        const insertAttendanceData: AttendancePunchinArgs = {
            userId,
            officeId,
            location,
            punchIn,
            punchOut
        }

        const insertedAttendanceData = await insertAttendance(insertAttendanceData);
        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse(responseMessage.ATTENDANCE_CREATED, insertedAttendanceData))
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}


/**
 * Controller function to handle the Attendnace Updation.
 * @protected - This is an admin-only feature.
 */
export const updateAttendance = async (req: customRequestWithPayload<{ id: string }, any, updateAttendanceBody>, res: Response, next: NextFunction) => {
    const functionName = 'updateAttendance';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new BadRequestError(errorMessage.INVALID_ID);

        const existingAttendance = await findAttendanceById(id);
        if (!existingAttendance) throw new NotFoundError(errorMessage.ATTENDANCE_NOT_FOUND);

        const existingUser = await findUserById(existingAttendance.userId.toString());
        if (!existingUser) throw new NotFoundError(errorMessage.USER_NOT_FOUND_ASSOCIATED_WITH_ATTENDANCE);

        const userDefaultRole = await getDefaultRoleFromUserRole(existingUser.role);

        let attendnceLocation;

        if (existingUser.officeId && userDefaultRole !== Roles.admin) {
            const existingOffice = await findOfficeById(existingUser.officeId.toString());
            if (!existingOffice) throw new InternalServerError(errorMessage.OFFICE_ID_NOT_FOUND_IN_SYSTEM);
            attendnceLocation = existingOffice.location;
        }
        else if (userDefaultRole !== Roles.admin) throw new ForbiddenError(errorMessage.USER_NOT_ASSIGNED_TO_OFFICE);
        else {
            attendnceLocation = existingAttendance.location;
        }

        const { punchInTime, date, punchOutTime, latitude, longitude } = req.body;
        const updateAttendanceArgs: UpdateAttendanceArgs = {};

        if (latitude && longitude) {
            updateAttendanceArgs.location = { latitude, longitude };

            if (userDefaultRole !== Roles.admin) {
                if (!existingUser.officeId) throw new ForbiddenError(errorMessage.USER_NOT_ASSIGNED_TO_OFFICE);

                const existingOffice = await findOfficeById(existingUser.officeId.toString());
                if (!existingOffice) throw new InternalServerError(errorMessage.OFFICE_ID_NOT_FOUND_IN_SYSTEM);

                if (!validateLocationWithinInstitutionRadius({ latitude, longitude }, existingOffice.location, existingOffice.radius)) {
                    throw new ForbiddenError(errorMessage.INVALID_ATTENDANCE_LOCATION);
                }
            } else {
                const availableOffices = await getAllOfficeLocationsAndRadius();
                if (!availableOffices || availableOffices.length === 0) {
                    throw new ForbiddenError(errorMessage.NO_OFFICES_AVAILABLE_FOR_MARK_ATTENDANCE);
                }

                if (!validateLocationWithinMultipleInstitutionsRadius({ latitude, longitude }, availableOffices)) {
                    throw new ForbiddenError(errorMessage.INVALID_ATTENDANCE_LOCATION);
                }
            }

            attendnceLocation = updateAttendanceArgs.location;
        }

        if (date) {
            const timezone = getTimeZoneOfLocation(attendnceLocation);
            if (compareDatesWithCurrentDate(date) === DateStatus.Future) {
                throw new BadRequestError(errorMessage.CANNOT_MARK_FUTURE_ATTENDANCE);
            }

            if (punchInTime) {
                updateAttendanceArgs.punchIn = getDateFromInput(date, punchInTime, timezone);
                const hasExistingPunchIn = await checkPunchInForDay(existingAttendance.userId.toString(), updateAttendanceArgs.punchIn);
                if (hasExistingPunchIn) {
                    throw new ConflictError(errorMessage.USER_ALREADY_HAS_ATTENDANCE);
                }
            }

            updateAttendanceArgs.punchOut = punchOutTime ? getDateFromInput(date, punchOutTime, timezone) : undefined;
        } else {
            if (punchInTime) {
                updateAttendanceArgs.punchIn = updateHoursAndMinutesInISODate(existingAttendance.punchIn, punchInTime);
            }

            if (punchOutTime) {
                updateAttendanceArgs.punchOut = updateHoursAndMinutesInISODate(existingAttendance.punchIn, punchOutTime);
            }
        }

        if (updateAttendanceArgs.punchOut || existingAttendance.punchOut) {
            if (!comparePunchInPunchOut(updateAttendanceArgs.punchIn, updateAttendanceArgs.punchOut, existingAttendance)) {
                throw new ConflictError(errorMessage.PUNCH_IN_BEFORE_PUNCH_OUT);
            }
        }

        const updatedAttendance = await updateAttendanceById(existingAttendance._id.toString(), updateAttendanceArgs);
        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse(responseMessage.ATTENDANCE_UPDATED, updatedAttendance));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}


/**
 * Controller function to handle the Attendnace Deletion.
 * @protected - This is an admin-only feature.
 */
export const deleteAttendance = async (req: customRequestWithPayload<{ id: string }>, res: Response, next: NextFunction) => {
    const functionName = 'deleteAttendance';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) throw new BadRequestError(errorMessage.INVALID_ID);

        const existingAttendance = await findAttendanceById(id);
        if (!existingAttendance) throw new NotFoundError(errorMessage.ATTENDANCE_NOT_FOUND);

        const existingUser = await findUserById(existingAttendance.userId.toString());
        if (!existingUser) throw new InternalServerError(errorMessage.USER_DATA_NOT_FOUND_OF_ATTENDANCE);

        if (existingUser.officeId) {
            const existingOffice = await findOfficeById(existingUser.officeId.toString());
            if (!existingOffice) throw new InternalServerError(errorMessage.DELETED_OFFICE_ID_STILL_ASSOCIATED);
        }

        const isDeleted = await deleteAttendnaceById(id);
        if (!isDeleted) throw new NotFoundError(errorMessage.ATTENDANCE_NOT_FOUND);

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse(responseMessage.ATTENDANCE_DELETED));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}


/**
 * Controller function to handle the attendance data fetch request.
 * This function processes the attendance data fetch request based on the user's role:
 * - Admin: Can access all attendance data.
 * - Manager: Can access attendance data of their assigned office.
 * - User: Can access only their own attendance data.
 */
export const readAllAttendance = async (req: customRequestWithPayload<{}, any, any, AttendanceFilterQuery>, res: Response, next: NextFunction) => {
    const functionName = 'readAllAttendance';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const ownerId = req.payload?.id as string;
        const ownerData = await findUserById(ownerId);
        if (!ownerData) throw new AuthenticationError();
        const ownerRole = await getDefaultRoleFromUserRole(ownerData.role);

        const { pageLimit, pageNo, sortKey, date, officeId, userId, ...remainingQueryFeilds } = req.query;

        if (userId) {
            if (ownerRole == Roles.employee) throw new ForbiddenError(errorMessage.INSUFFICIENT_PRIVILEGES);

            const existingUser = await findUserById(userId);
            if (!existingUser) throw new NotFoundError(errorMessage.USER_NOT_FOUND);

            if (!existingUser.officeId) throw new ForbiddenError(errorMessage.NO_OFFICE_ASSIGNMENT);

            const existingOffice = findOfficeById(existingUser.officeId.toString());
            if (!existingOffice) throw new InternalServerError(errorMessage.USER_DATA_NOT_FOUND_OF_ATTENDANCE);
        }

        if (officeId) {
            if (ownerRole !== Roles.admin) throw new ForbiddenError(errorMessage.INSUFFICIENT_PRIVILEGES);

            const existingOffice = findOfficeById(officeId.toString());
            if (!existingOffice) throw new InternalServerError(errorMessage.USER_DATA_NOT_FOUND_OF_ATTENDANCE);
        }

        if (date) {
            const dateStatus = compareDatesWithCurrentDate(date);
            if (dateStatus == DateStatus.Future) throw new BadRequestError(errorMessage.CANNOT_FILTER_FUTURE_ATTENDANCE)
        }

        const query: AttendanceQuery = { date, ...remainingQueryFeilds };

        if (ownerRole == Roles.admin) {
            query.officeId = officeId;
            query.userId = userId;
        }
        else if (ownerRole == Roles.manager) {
            if (!ownerData.officeId) throw new ForbiddenError(errorMessage.NO_OFFICE_ASSIGNMENT);
            query.officeId = ownerData.officeId.toString();
            query.userId = userId;
        }
        else {
            query.userId = ownerData._id.toString();
        }

        const sortArgs = getAttendanceSortArgs(sortKey);
        const fetchResult = await fetchAttendanceData(Number(pageNo), Number(pageLimit), query, sortArgs);

        const message = fetchResult ? responseMessage.ATTENDANCE_DATA_FETCHED : errorMessage.ATTENDANCE_DATA_NOT_FOUND;
        let PageNationFeilds;
        if (fetchResult) {
            const { data, ...pageInfo } = fetchResult
            PageNationFeilds = pagenate(pageInfo, req.originalUrl);
        }

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json({
            success: true, message, ...fetchResult, ...PageNationFeilds
        });
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}


/**
 * Controller function to handle the attendance summary request.
 * @protected - admin or manager previliaged user can only access the feature
 */
export const attendanceSummary = async (req: customRequestWithPayload<{}, any, any, AttendanceSummaryQuery>, res: Response, next: NextFunction) => {
    const functionName = 'attendanceSummary';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const ownerId = req.payload?.id as string;
        const ownerData = await findUserById(ownerId) as IUser;

        const { userId, startDate, endDate } = req.query;

        const StartAndEndDateStatus = [startDate, endDate].map(compareDatesWithCurrentDate);
        if (StartAndEndDateStatus.includes(DateStatus.Future)) throw new BadRequestError(errorMessage.CANNOT_FILTER_FUTURE_ATTENDANCE);

        const existingUser = await findUserById(userId);
        if (!existingUser) throw new NotFoundError(errorMessage.USER_NOT_FOUND);

        if (!existingUser.officeId) throw new ForbiddenError(errorMessage.NO_OFFICE_ASSIGNMENT);

        const existingOffice = findOfficeById(existingUser.officeId.toString());
        if (!existingOffice) throw new InternalServerError(errorMessage.OFFICE_ID_NOT_FOUND_IN_SYSTEM);

        if (ownerData.role !== Roles.admin) {
            const isPermitted = await isManagerAuthorizedForEmployee(userId, ownerId);
            if (!isPermitted) throw new ForbiddenError(errorMessage.ACCESS_RESTRICTED_TO_ASSIGNED_OFFICE);
        }

        const attendnceSummaryData = await findAttendanceSummary(req.query);
        const message = attendnceSummaryData ? responseMessage.ATTENDANCE_SUMMARY_FETCHED : errorMessage.NO_ATTENDANCE_HISTORY_IN_DATE_RANGE;

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse(message, attendnceSummaryData));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}