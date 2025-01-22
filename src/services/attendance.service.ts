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