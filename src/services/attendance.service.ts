import { IAttendance } from "../interfaces";
import { Attendance } from "../models";
import { AttendancePunchinArgs } from "../types";
import { logger } from "../utils"


export const validateUniqunessOfUserPunchIn = async (userId: string): Promise<boolean> => {
    try {
        const startOfCurrentDay = new Date();
        startOfCurrentDay.setHours(0, 0, 0, 0);

        const endOfCurrentDay = new Date();
        endOfCurrentDay.setHours(23, 59, 59, 999);

        const attendanceExistOnCurrentDay = await Attendance.exists({
            userId,
            punchIn: { $gte: startOfCurrentDay, $lt: endOfCurrentDay }
        });

        return attendanceExistOnCurrentDay === null;
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