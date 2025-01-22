import { NextFunction, Response } from "express";
import { customRequestWithPayload, IAttendance } from "../interfaces";
import { compareDates, getDateFromInput, logger, sendCustomResponse, updateHoursAndMinutesInDate } from "../utils";
import { AuthenticationError, BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../errors";
import { comparePunchInPunchOut, findAttendanceById, findOfficeById, findUserById, insertAttendance, isPunchInRecordedForDay, updateAttendanceById } from "../services";
import { AttendancePunchinArgs, createAttendanceBody, Location, TimeInHHMM, UpdateAttendanceArgs, updateAttendanceBody } from "../types";
import { DateStatus } from "../enums";
import { isValidObjectId } from "../validators";




export const punchIn = async (req: customRequestWithPayload<{}, any, Location>, res: Response, next: NextFunction) => {
    try {
        const userId = req.payload?.id as string;
        const existingUser = await findUserById(userId);
        if (!existingUser) throw new AuthenticationError();

        if (!existingUser.officeId) throw new ForbiddenError("You can't punchin, without assigned in any office");

        const existingOffice = await findOfficeById(existingUser.officeId.toString());
        if (!existingOffice) throw Error('deleted officeId still found on user, System failure!');

        const hasPunchIn = await isPunchInRecordedForDay(userId);
        if (hasPunchIn) throw new ConflictError('You have already punch in once on the day');

        const newAttendance: AttendancePunchinArgs = {
            userId,
            officeId: existingUser.officeId.toString(),
            location: req.body,
        }
        const addedAttendance = await insertAttendance(newAttendance);

        res.status(201).json(await sendCustomResponse("Attendance Punch In Successfully", addedAttendance));
    } catch (error) {
        logger.error(error);
        next(error);
    }
}

export const punchOut = async (req: customRequestWithPayload<{}, any, Location>, res: Response, next: NextFunction) => {
    try {
        const userId = req.payload?.id as string;
        const existingUser = await findUserById(userId);
        if (!existingUser) throw new AuthenticationError();

        if (!existingUser.officeId) throw new ForbiddenError("You can't punchin, without assigned in any office");

        const existingOffice = await findOfficeById(existingUser.officeId.toString());
        if (!existingOffice) throw Error('deleted officeId still found on user, System failure!');

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

export const createAttendance = async (req: customRequestWithPayload<{ userId: string }, any, createAttendanceBody>, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const isValidUserId = isValidObjectId(userId);
        if (!isValidUserId) throw new BadRequestError("inValidUserId provided")

        const existingUser = await findUserById(userId);
        if (!existingUser) throw new NotFoundError("Requested user not found!");

        if (!existingUser.officeId) throw new ForbiddenError("You can't punchin, without assigned in any office");

        const existingOffice = await findOfficeById(existingUser.officeId.toString());
        if (!existingOffice) throw Error('deleted officeId still found on user, System failure!');

        const { punchInTime, date, punchOutTime, latitude, longitude } = req.body;

        const dateStatus = compareDates(date);
        if (dateStatus == DateStatus.Future) throw new BadRequestError("Can't add attendance for future");

        const punchIn = getDateFromInput(date, punchInTime);
        const hasPunchIn = await isPunchInRecordedForDay(userId, punchIn);
        logger.info(hasPunchIn);
        if (hasPunchIn) throw new ConflictError('Provided User Already have an attendnace data on given date');

        const punchOut = getDateFromInput(date, punchOutTime);

        const location: Location = { latitude, longitude };

        const insertAttendanceData: AttendancePunchinArgs = {
            userId,
            officeId: existingUser.officeId.toString(),
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

export const updateAttendance = async (req: customRequestWithPayload<{ id: string }, any, updateAttendanceBody>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const isValidUserId = isValidObjectId(id);
        if (!isValidUserId) throw new BadRequestError("inValidUserId provided");

        const existingAttendance = await findAttendanceById(id);
        if (!existingAttendance) throw new NotFoundError('Requested Attendance Data not found!')

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
            const dateStatus = compareDates(date);
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
        next(error)
    }
}