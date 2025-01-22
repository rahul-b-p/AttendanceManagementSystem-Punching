import { IAttendance } from "../interfaces";
import { Attendance } from "../models";
import { AttendancePunchinArgs, UpdateAttendanceArgs } from "../types";
import { logger } from "../utils"


export const isPunchInRecordedForDay = async (userId: string, date?: Date): Promise<IAttendance | null> => {
    try {
        let punchIn: any;
        if (date) {
            punchIn = date;
        }
        else {
            const startOfCurrentDay = new Date();
            startOfCurrentDay.setHours(0, 0, 0, 0);

            const endOfCurrentDay = new Date();
            endOfCurrentDay.setHours(23, 59, 59, 999);

            punchIn = { $gte: startOfCurrentDay, $lt: endOfCurrentDay }
        }


        const attendanceExistOnCurrentDay = await Attendance.findOne({
            userId,
            punchIn
        });

        return attendanceExistOnCurrentDay;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const insertAttendance = async (attendanceData: AttendancePunchinArgs): Promise<IAttendance> => {
    try {
        const newAttendance = new Attendance(attendanceData);
        await newAttendance.save();

        delete (newAttendance as any).__v;
        return newAttendance;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const updateAttendanceById = async (_id: string, upddateData: UpdateAttendanceArgs): Promise<IAttendance | null> => {
    try {
        const updatedAttendance = await Attendance.findByIdAndUpdate(_id, upddateData, { new: true });

        delete (updatedAttendance as any).__v;

        return updatedAttendance
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const findAttendanceById = async (_id: string): Promise<IAttendance | null> => {
    try {
        return await Attendance.findById(_id);
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const comparePunchInPunchOut = (punchIn?: Date, punchOut?: Date, existingAttendance?: IAttendance): boolean => {
    try {
        if (!punchIn && !punchOut) throw new Error('Either punchIn or punchOut argument are required');
        else if (punchIn && punchOut) {
            return punchOut > punchIn;
        }
        else if (punchIn && existingAttendance) {
            return existingAttendance.punchOut ? existingAttendance.punchOut > punchIn : false;
        }
        else if (punchOut && existingAttendance) {
            return punchOut > existingAttendance.punchIn;
        }
        else if (existingAttendance) {
            return existingAttendance.punchOut ? existingAttendance.punchOut > existingAttendance.punchIn : true;
        }
        else {
            throw new Error('No Data Provided for a comparison, Invalid usage of puchIn punchOut time comparison');
        }
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

export const deleteAttendnaceById = async (_id: string): Promise<boolean> => {
    try {
        const deletedUser = await Attendance.findByIdAndDelete(_id);

        return deletedUser !== null;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}