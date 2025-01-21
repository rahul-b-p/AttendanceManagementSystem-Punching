import { NextFunction, Response } from "express";
import { customRequestWithPayload } from "../interfaces";
import { logger, sendCustomResponse } from "../utils";
import { AuthenticationError, ConflictError, ForbiddenError } from "../errors";
import { findOfficeById, findUserById, insertAttendance, validateUniqunessOfUserPunchIn } from "../services";
import { AttendancePunchinArgs, Location } from "../types";




export const punchIn = async (req: customRequestWithPayload<{}, any, Location>, res: Response, next: NextFunction) => {
    try {
        const userId = req.payload?.id as string;
        const existingUser = await findUserById(userId);
        if (!existingUser) throw new AuthenticationError();

        if (!existingUser.officeId) throw new ForbiddenError("You can't punchin, without assigned in any office");

        const existingOffice = await findOfficeById(existingUser.officeId.toString());
        if (!existingOffice) throw Error('deleted officeId found on user, System failure!');

        const isFirstPunchInOnTheDay = await validateUniqunessOfUserPunchIn(userId);
        if (!isFirstPunchInOnTheDay) throw new ConflictError('You have already punch in once on the day');

        const newAttendance: AttendancePunchinArgs = {
            userId,
            officeId: existingUser.officeId.toString(),
            location: req.body,
        }
        const addedAttendance = await insertAttendance(newAttendance);

        res.status(201).json(await sendCustomResponse("Punch In Completed Successfully", addedAttendance));
    } catch (error) {
        logger.info(error);
        next(error);
    }
}