import { Types } from "mongoose";
import { AttendanceSortArgs } from "../enums";
import { IAttendance } from "../interfaces";
import { Attendance } from "../models";
import { AttendanceFetchResult, AttendancePunchinArgs, AttendanceQuery, AttendanceSummary, AttendanceSummaryQuery, AttendanceToShow, UpdateAttendanceArgs } from "../types";
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

export const fetchAttendanceData = async (page: number, limit: number, query: AttendanceQuery, sort: AttendanceSortArgs) => {
    try {
        const skip = (page - 1) * limit;

        const { date, officeId, userId } = query;

        const matchFilter: any = {}
        if (date) {
            let start = new Date(date);
            start.setHours(0, 0, 0, 0);
            let end = new Date(date);
            end.setHours(23, 59, 59, 99);
            matchFilter["punchIn"] = { $gte: start, $lte: end };
        }
        if (userId) {
            matchFilter["userId"] = new Types.ObjectId(userId);
        }
        if (officeId) {
            matchFilter["officeId"] = new Types.ObjectId(officeId);
        }

        const totalFilter = await Attendance.aggregate([
            { $match: matchFilter },
            {
                $count: 'totalCount'
            }
        ]);


        const totalItems = totalFilter.length > 0 ? totalFilter[0].totalCount : 0;

        const attendances: AttendanceToShow[] = await Attendance.aggregate([
            { $match: matchFilter },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'offices',
                    localField: 'officeId',
                    foreignField: '_id',
                    as: 'office',
                }
            },
            {
                $unwind: {
                    path: "$office",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true,
                },
            },
            { $sort: JSON.parse(sort) },
            {
                $project: {
                    _id: 1,
                    punchIn: 1,
                    punchOut: 1,
                    location: 1,
                    user: {
                        _id: 1,
                        username: 1,
                        role: 1,
                        email: 1,
                        phone: 1
                    },
                    office: {
                        _id: 1,
                        officeName: 1,
                        adress: {
                            street: 1,
                            city: 1,
                            state: 1,
                            zip_code: 1
                        },
                        location: {
                            latitude: 1,
                            longitude: 1
                        },
                        radius: 1
                    }
                },
            },
        ]);

        const totalPages = Math.ceil(totalItems / limit);
        const fetchResult: AttendanceFetchResult = {
            page,
            pageSize: limit,
            totalPages,
            totalItems,
            data: attendances
        }

        return attendances.length > 0 ? fetchResult : null;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const findAttendanceSummary = async (query: AttendanceSummaryQuery): Promise<AttendanceSummary | null> => {
    const { userId, endDate, startDate } = query
    try {
        const matchFilter = {
            userId: new Types.ObjectId(userId),
            punchIn: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }
        
        const attendanceSummary: AttendanceSummary[] = await Attendance.aggregate([
            { $match: matchFilter },
            {
                $project: {
                    userId: 1,
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$punchIn" } }, // Extract date from punchIn
                    workingHours: {
                        $cond: {
                            if: { $and: ["$punchOut", "$punchIn"] },
                            then: { $divide: [{ $subtract: ["$punchOut", "$punchIn"] }, 1000 * 60 * 60] }, // Hours
                            else: 0,
                        },
                    },
                    punchOutMissing: { $not: ["$punchOut"] }, // Mark records missing punchOut
                }
            },
            {
                $group: {
                    _id: { userId: "$userId" },
                    totalDays: { $sum: 1 }, // Count total days
                    totalHours: { $sum: "$workingHours" }, // Sum of working hours
                    missedPunchOuts: { $sum: { $cond: ["$punchOutMissing", 1, 0] } }, // Count missed punch-outs
                },
            },
            {
                $project: {
                    _id: 0,
                    userId: "$_id.userId",
                    totalDays: 1,
                    totalHours: { $round: ["$totalHours", 2] }, // Round to 2 decimal places
                    missedPunchOuts: 1,
                },
            },
        ]);

        return attendanceSummary.length > 0 ? attendanceSummary[0] : null;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}