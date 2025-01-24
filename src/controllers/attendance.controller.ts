import { NextFunction, Response } from "express";
import { customRequestWithPayload, IAttendance, IUser } from "../interfaces";
import { compareDatesWithCurrentDate, getAttendanceSortArgs, getDateFromInput, logger, pagenate, sendCustomResponse, updateHoursAndMinutesInDate } from "../utils";
import { AuthenticationError, BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../errors";
import { comparePunchInPunchOut, deleteAttendnaceById, fetchAttendanceData, findAttendanceById, findAttendanceSummary, findOfficeById, findUserById, getAllOfficeLocationsAndRadius, getDefaultRoleFromUserRole, insertAttendance, isManagerAuthorizedForEmployee, isPunchInRecordedForDay, updateAttendanceById } from "../services";
import { AttendanceFilterQuery, AttendancePunchinArgs, AttendanceQuery, AttendanceSummaryQuery, createAttendanceBody, Location, UpdateAttendanceArgs, updateAttendanceBody } from "../types";
import { DateStatus, Roles } from "../enums";
import { isValidObjectId, validateLocationWithinInstitutionRadius, validateLocationWithinMultipleInstitutionsRadius } from "../validators";



/**
 * Controller function to handle the punch-in attendance request.
 */
export const punchInAttendance = async (req: customRequestWithPayload<{}, any, Location>, res: Response, next: NextFunction) => {
    try {
        const userId = req.payload?.id as string;
        const existingUser = await findUserById(userId);
        if (!existingUser) throw new AuthenticationError();

        const userRoleAsDefaultRole = await getDefaultRoleFromUserRole(existingUser.role);

        const requestedUserLocation = req.body;

        let officeId;

        if (userRoleAsDefaultRole !== Roles.admin) {
            if (!existingUser.officeId) throw new ForbiddenError("You can't punchin, without assigned in any office");

            const existingOffice = await findOfficeById(existingUser.officeId.toString());
            if (!existingOffice) throw Error('deleted officeId still found on user, System failure!');

            const isValidLocation = validateLocationWithinInstitutionRadius(requestedUserLocation, existingOffice.location, existingOffice.radius);
            if (!isValidLocation) throw new ForbiddenError("Requested from invalid location.You are not permitted to mark attendance from this location.");
            officeId = existingOffice._id.toString();
        }
        else {
            const availableOfficeLocationsWithRadius = await getAllOfficeLocationsAndRadius();
            if (!availableOfficeLocationsWithRadius) throw new ForbiddenError('No offices are availabe on the system to take punchIn');
            const isValidLocation = validateLocationWithinMultipleInstitutionsRadius(requestedUserLocation, availableOfficeLocationsWithRadius);
            if (!isValidLocation) throw new ForbiddenError("Requested from invalid location.You are not permitted to mark attendance from this location.");
            officeId = isValidLocation.officeId;
        }

        const hasPunchIn = await isPunchInRecordedForDay(userId);
        if (hasPunchIn) throw new ConflictError('You have already punch in once on the day');

        const newAttendance: AttendancePunchinArgs = {
            userId,
            officeId,
            location: req.body,
        }
        const addedAttendance = await insertAttendance(newAttendance);

        res.status(201).json(await sendCustomResponse("Attendance Punch In Successfully", addedAttendance));
    } catch (error) {
        logger.error(error);
        next(error);
    }
}


/**
 * Controller function to handle the punch-out attendance request.
 */
export const punchOutAttendance = async (req: customRequestWithPayload<{}, any, Location>, res: Response, next: NextFunction) => {
    try {
        const userId = req.payload?.id as string;
        const existingUser = await findUserById(userId);
        if (!existingUser) throw new AuthenticationError();

        const userRoleAsDefaultRole = await getDefaultRoleFromUserRole(existingUser.role);

        const requestedUserLocation = req.body;

        if (userRoleAsDefaultRole !== Roles.admin) {
            if (!existingUser.officeId) throw new ForbiddenError("You can't punchin, without assigned in any office");

            const existingOffice = await findOfficeById(existingUser.officeId.toString());
            if (!existingOffice) throw Error('deleted officeId still found on user, System failure!');

            const isValidLocation = validateLocationWithinInstitutionRadius(requestedUserLocation, existingOffice.location, existingOffice.radius);
            if (!isValidLocation) throw new ForbiddenError("Requested from invalid location.You are not permitted to mark attendance from this location.");
        }
        else {
            const availableOfficeLocationsWithRadius = await getAllOfficeLocationsAndRadius();
            if (!availableOfficeLocationsWithRadius) throw new ForbiddenError('No offices are availabe on the system to take punchIn');
            const isValidLocation = validateLocationWithinMultipleInstitutionsRadius(requestedUserLocation, availableOfficeLocationsWithRadius);
            if (!isValidLocation) throw new ForbiddenError("Requested from invalid location.You are not permitted to mark attendance from this location.");
        }

        const hasPunchIn = await isPunchInRecordedForDay(userId);
        if (!hasPunchIn) throw new ConflictError("You should punchIn before punchOut");

        if (hasPunchIn.punchOut) throw new ConflictError("You have already completed punchOut on the day");

        const currentTimestamp = new Date();
        const updateBody: UpdateAttendanceArgs = { punchOut: currentTimestamp };

        const updatedAttendanceData = await updateAttendanceById(hasPunchIn._id.toString(), updateBody);
        res.status(200).json(await sendCustomResponse('Attendance Punch Out Successfully', updatedAttendanceData));
    } catch (error) {
        logger.info(error);
        next(error);
    }
}


/**
 * Controller function to handle the Attendnace Creation.
 * @protected - This is an admin-only feature.
 */
export const createAttendance = async (req: customRequestWithPayload<{ userId: string }, any, createAttendanceBody>, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const isValidUserId = isValidObjectId(userId);
        if (!isValidUserId) throw new BadRequestError("inValidUserId provided")

        const existingUser = await findUserById(userId);
        if (!existingUser) throw new NotFoundError("Requested user not found!");

        const existingUsersDefaultRole = await getDefaultRoleFromUserRole(existingUser.role);
        const { punchInTime, date, punchOutTime, ...location } = req.body;

        let officeId;
        if (existingUsersDefaultRole !== Roles.admin) {
            if (!existingUser.officeId) throw new ForbiddenError("You can't punchin, without assigned in any office");

            const existingOffice = await findOfficeById(existingUser.officeId.toString());
            if (!existingOffice) throw Error('deleted officeId still found on user, System failure!');

            const isValidLocation = validateLocationWithinInstitutionRadius(location, existingOffice.location, existingOffice.radius);
            if (!isValidLocation) throw new ForbiddenError("Requested from invalid location.You are not permitted to mark attendance from this location.");
            officeId = existingOffice._id.toString();
        }
        else {
            const availableOfficeLocationsWithRadius = await getAllOfficeLocationsAndRadius();
            if (!availableOfficeLocationsWithRadius) throw new ForbiddenError('No offices are availabe on the system to take punchIn');
            const isValidLocation = validateLocationWithinMultipleInstitutionsRadius(location, availableOfficeLocationsWithRadius);
            if (!isValidLocation) throw new ForbiddenError("Requested from invalid location.You are not permitted to mark attendance from this location.");
            officeId = isValidLocation.officeId;
        }


        const dateStatus = compareDatesWithCurrentDate(date);
        if (dateStatus == DateStatus.Future) throw new BadRequestError("Can't add attendance for future");

        const punchIn = getDateFromInput(date, punchInTime);
        const hasPunchIn = await isPunchInRecordedForDay(userId, punchIn);
        logger.info(hasPunchIn);
        if (hasPunchIn) throw new ConflictError('Provided User Already have an attendnace data on given date');

        const punchOut = getDateFromInput(date, punchOutTime);


        const insertAttendanceData: AttendancePunchinArgs = {
            userId,
            officeId,
            location,
            punchIn,
            punchOut
        }

        const insertedAttendanceData = await insertAttendance(insertAttendanceData);
        res.status(200).json(await sendCustomResponse('created a new attendance data feild', insertedAttendanceData))

    } catch (error) {
        logger.error(error);
        next(error);
    }
}


/**
 * Controller function to handle the Attendnace Updation.
 * @protected - This is an admin-only feature.
 */
export const updateAttendance = async (req: customRequestWithPayload<{ id: string }, any, updateAttendanceBody>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) throw new BadRequestError("inValidUserId provided");

        const existingAttendance = await findAttendanceById(id);
        if (!existingAttendance) throw new NotFoundError('Requested Attendance Data not found!');

        const existingUser = await findUserById(existingAttendance.userId.toString());
        if (!existingUser) throw new Error("Not Found the user data of existing attendance Feild!");

        if (existingUser.officeId) {
            const existingOffice = await findOfficeById(existingUser.officeId.toString());
            if (!existingOffice) throw Error('deleted officeId still found on user, System failure!');
        }

        const { punchInTime, date, punchOutTime, latitude, longitude } = req.body;

        const updateAttendanceArgs: UpdateAttendanceArgs = {};
        let hasPunchIn: IAttendance | null;
        if (date) {
            const dateStatus = compareDatesWithCurrentDate(date);
            if (dateStatus == DateStatus.Future) throw new BadRequestError("Can't update to a future date");

            if (punchInTime) {
                updateAttendanceArgs.punchIn = getDateFromInput(date, punchInTime);
                hasPunchIn = await isPunchInRecordedForDay(existingAttendance.userId.toString(), updateAttendanceArgs.punchIn);
                logger.info(hasPunchIn);
                if (hasPunchIn) throw new ConflictError("User has existing Attendance data on given date, can't update into this date");
            }

            updateAttendanceArgs.punchOut = punchOutTime ? getDateFromInput(date, punchOutTime) : undefined;
        }
        else {
            if (punchInTime) {
                updateAttendanceArgs.punchIn = updateHoursAndMinutesInDate(existingAttendance.punchIn, punchInTime)
            }

            if (punchOutTime) {
                updateAttendanceArgs.punchOut = updateHoursAndMinutesInDate(existingAttendance.punchIn, punchOutTime)
            }
        }

        const isPunchoutAfterPunchIn = comparePunchInPunchOut(updateAttendanceArgs.punchIn, updateAttendanceArgs.punchOut, existingAttendance)
        if (!isPunchoutAfterPunchIn) throw new ConflictError("Can't update feilds as punchOut time after punchIntime")

        if (latitude && longitude) {
            updateAttendanceArgs.location = { latitude, longitude };
        }

        const updatedAttendnaceData = await updateAttendanceById(existingAttendance._id.toString(), updateAttendanceArgs);
        res.status(200).json(await sendCustomResponse("updated given Attendnace", updatedAttendnaceData));
    } catch (error) {
        logger.error(error);
        next(error);
    }
}


/**
 * Controller function to handle the Attendnace Deletion.
 * @protected - This is an admin-only feature.
 */
export const deleteAttendance = async (req: customRequestWithPayload<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) throw new BadRequestError("inValidUserId provided");

        const existingAttendance = await findAttendanceById(id);
        if (!existingAttendance) throw new NotFoundError('Requested Attendance Data not found!');

        const existingUser = await findUserById(existingAttendance.userId.toString());
        if (!existingUser) throw new Error("Not Found the user data of existing attendance Feild!");

        if (existingUser.officeId) {
            const existingOffice = await findOfficeById(existingUser.officeId.toString());
            if (!existingOffice) throw Error('deleted officeId still found on user, System failure!');
        }

        const isDeleted = await deleteAttendnaceById(id);
        if (!isDeleted) throw new NotFoundError('Requested Attendance Data not found!');

        res.status(200).json(await sendCustomResponse("Attendance Data Deleted Successfully"));
    } catch (error) {
        logger.error(error);
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
    try {
        const ownerId = req.payload?.id as string;
        const ownerData = await findUserById(ownerId);
        if (!ownerData) throw new AuthenticationError();
        const ownerRole = await getDefaultRoleFromUserRole(ownerData.role);

        const { pageLimit, pageNo, sortKey, date, officeId, userId, ...remainingQueryFeilds } = req.query;

        if (userId) {
            if (ownerRole == Roles.employee) throw new ForbiddenError("Insufficient permisson to retrive a specific users attendnace data");

            const existingUser = await findUserById(userId);
            if (!existingUser) throw new NotFoundError('No User Found with queried userId!');

            if (!existingUser.officeId) throw new ForbiddenError("User not Assigend on any office, You can't get the attendance Summary");

            const existingOffice = findOfficeById(existingUser.officeId.toString());
            if (!existingOffice) throw new Error('Not Found the user data of existing attendance Feild!');
        }

        if (officeId) {
            if (ownerRole !== Roles.admin) throw new ForbiddenError("Insufficient permisson to retrive an office data");

            const existingOffice = findOfficeById(officeId.toString());
            if (!existingOffice) throw new Error('Not Found the user data of existing attendance Feild!');
        }

        if (date) {
            const dateStatus = compareDatesWithCurrentDate(date);
            if (dateStatus == DateStatus.Future) throw new BadRequestError("Can't filter future Attendnace data!")
        }

        const query: AttendanceQuery = { date, ...remainingQueryFeilds };

        if (ownerRole == Roles.admin) {
            query.officeId = officeId;
            query.userId = userId;
        }
        else if (ownerRole == Roles.manager) {
            if (!ownerData.officeId) throw new ForbiddenError("You are not assigned In any office, Can't read any office data");
            query.officeId = ownerData.officeId.toString();
            query.userId = userId;
        }
        else {
            query.userId = ownerData._id.toString();
        }

        const sortArgs = getAttendanceSortArgs(sortKey);
        const fetchResult = await fetchAttendanceData(Number(pageNo), Number(pageLimit), query, sortArgs);

        const message = fetchResult ? 'Attendance Data Fetched Successfully' : 'No Attendnace Data found to show';
        let PageNationFeilds;
        if (fetchResult) {
            const { data, ...pageInfo } = fetchResult
            PageNationFeilds = pagenate(pageInfo, req.originalUrl);
        }

        res.status(200).json({
            success: true, message, ...fetchResult, ...PageNationFeilds
        });
    } catch (error) {
        logger.error(error);
        next(error);
    }
}


/**
 * Controller function to handle the attendance summary request.
 * @protected - admin or manager previliaged user can only access the feature
 */
export const attendanceSummary = async (req: customRequestWithPayload<{}, any, any, AttendanceSummaryQuery>, res: Response, next: NextFunction) => {
    try {
        const ownerId = req.payload?.id as string;
        const ownerData = await findUserById(ownerId) as IUser;

        const { userId, startDate, endDate } = req.query;

        const StartAndEndDateStatus = [startDate, endDate].map(compareDatesWithCurrentDate);
        if (StartAndEndDateStatus.includes(DateStatus.Future)) throw new BadRequestError("Can't compare date status of future");

        const existingUser = await findUserById(userId);
        if (!existingUser) throw new NotFoundError('No User Found with queried userId!');

        if (!existingUser.officeId) throw new ForbiddenError("User not Assigend on any office, You can't get the attendance Summary");

        const existingOffice = findOfficeById(existingUser.officeId.toString());
        if (!existingOffice) throw new Error('Not Found the user data of existing attendance Feild!');

        if (ownerData.role !== Roles.admin) {
            const isPermitted = await isManagerAuthorizedForEmployee(userId, ownerId);
            if (!isPermitted) throw new ForbiddenError('You can Only Access Employees of Assigned office');
        }

        const attendnceSummaryData = await findAttendanceSummary(req.query);
        const message = attendnceSummaryData ? `Fetched Attenadance summary of user with id: ${userId} between ${startDate} and ${endDate} ` : `User with id: ${userId} have no Attendance history between  ${startDate} and ${endDate}`
        res.status(200).json(await sendCustomResponse(message, attendnceSummaryData));
    } catch (error) {
        logger.error(error);
        next(error);
    }
}