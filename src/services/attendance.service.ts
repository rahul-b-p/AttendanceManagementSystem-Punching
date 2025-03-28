import { Types } from "mongoose";
import { AttendanceSortArgs, FetchType, FunctionStatus } from "../enums";
import { IAttendance } from "../interfaces";
import { Attendance } from "../models";
import { AttendanceFetchResult, AttendancePunchinArgs, AttendanceQuery, AttendanceSummary, AttendanceSummaryQuery, AttendanceToShow, UpdateAttendanceArgs } from "../types";
import { calculatePageSkip, getDateRange, getDayRange, getTimeStamp, logFunctionInfo, logger, prepareAddFeilds, prepareMatchFilter } from "../utils"
import { validateAttendanceQuery } from "../validators";
import moment from "moment";
import { errorMessage } from "../constants";

/**
 * Checks if a punch-in record exists for the specified user on the given date.
 * If no date is provided, it checks for the current date.
*/
export const checkPunchInForDay = async (userId: string, date?: string): Promise<IAttendance | null> => {
    const functionName = 'checkPunchInForDay';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        let punchIn: any;
        if (date) {
            const dayRange = getDayRange(date);

            punchIn = { $gte: dayRange[0], $lte: dayRange[1] };
        }
        else {
            const currentDate = getTimeStamp();
            const currentDayRange = getDayRange(currentDate);

            punchIn = { $gte: currentDayRange[0], $lt: currentDayRange[1] }
        }

        const attendanceExistOnCurrentDay = await Attendance.findOne({
            userId,
            punchIn,
            isDeleted: false
        });

        logFunctionInfo(functionName, FunctionStatus.success);
        return attendanceExistOnCurrentDay;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 * Inserts a new attendnace data
*/
export const insertAttendance = async (attendanceData: AttendancePunchinArgs): Promise<IAttendance> => {
    const functionName = 'insertAttendance';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const newAttendance = new Attendance(attendanceData);
        await newAttendance.save();

        delete (newAttendance as any).__v;
        logFunctionInfo(functionName, FunctionStatus.success);
        return newAttendance;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 * update an attendnace data on database using its id, if no attendnace dta found with the id, then it returns null 
*/
export const updateAttendanceById = async (_id: string, upddateData: UpdateAttendanceArgs): Promise<IAttendance | null> => {
    const functionName = 'updateAttendanceById';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const updatedAttendance = await Attendance.findByIdAndUpdate(_id, upddateData, { new: true });

        delete (updatedAttendance as any).__v;

        logFunctionInfo(functionName, FunctionStatus.success);
        return updatedAttendance
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 * find the attendance doccument with given id, otherwise returns null
*/
export const findAttendanceById = async (_id: string): Promise<IAttendance | null> => {
    const functionName = 'findAttendanceById';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const attennaceData = await Attendance.findById(_id).lean();

        if (attennaceData && attennaceData.isDeleted) return null;
        logFunctionInfo(functionName, FunctionStatus.success);
        return attennaceData;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 * Validates and compares punch-in and punch-out times, 
 * ensuring chronological correctness based on the provided times or existing attendance,
 * and handles errors with appropriate logging.
 */
export const comparePunchInPunchOut = (punchIn?: string, punchOut?: string, existingAttendance?: IAttendance): boolean => {
    const functionName = 'comparePunchInPunchOut';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        if (!punchIn && !punchOut) {
            throw new Error(errorMessage.PUNCH_IN_OR_OUT_REQUIRED);
        }

        if (punchIn && !moment(punchIn, moment.ISO_8601, true).isValid()) {
            throw new Error(errorMessage.INVALID_TIME_FORMAT);
        }

        if (punchOut && !moment(punchOut, moment.ISO_8601, true).isValid()) {
            throw new Error(errorMessage.INVALID_TIME_FORMAT);
        }

        const punchInMoment = punchIn ? moment(punchIn) : null;
        const punchOutMoment = punchOut ? moment(punchOut) : null;
        const existingPunchInMoment = existingAttendance?.punchIn ? moment(existingAttendance.punchIn) : null;
        const existingPunchOutMoment = existingAttendance?.punchOut ? moment(existingAttendance.punchOut) : null;

        if (punchInMoment && punchOutMoment) {
            return punchOutMoment.isAfter(punchInMoment);
        }

        if (punchInMoment && existingAttendance) {
            return existingPunchOutMoment ? existingPunchOutMoment.isAfter(punchInMoment) : false;
        }

        if (punchOutMoment && existingAttendance) {
            return existingPunchInMoment ? punchOutMoment.isAfter(existingPunchInMoment) : false;
        }

        if (existingAttendance) {
            return existingPunchOutMoment
                ? existingPunchOutMoment.isAfter(existingPunchInMoment || moment())
                : true;
        }

        throw new Error(errorMessage.INVALID_PUNCH_IN_OUT_COMPARISON);
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw error;
    }
};



/**
 * Deletes an existing attendnace using id, if no existing attendnace id, then returns null
 */
export const deleteAttendnaceById = async (_id: string): Promise<boolean> => {
    const functionName = 'deleteAttendnaceById';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const deletedUser = await Attendance.findByIdAndDelete(_id);

        logFunctionInfo(functionName, FunctionStatus.success);
        return deletedUser !== null;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 * Aggregates attendance data to count the number of records that match the given filter criteria.
 * This function applies the specified additional fields and filter conditions to an aggregation query 
 */
export const getAttendnaceFilterCount = async (addFeilds: Record<string, any>, matchFilter: Record<string, any>): Promise<number> => {
    logFunctionInfo("getAttendnaceFilterCount", FunctionStatus.start);

    try {
        const totalFilter = await Attendance.aggregate([
            {
                $addFields: addFeilds,
            },
            {
                $match: matchFilter
            },
            {
                $count: 'totalCount'
            }
        ]);

        return totalFilter.length > 0 ? totalFilter[0].totalCount as number : 0;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}


/**
 * Aggregates attendance data by applying custom fields, filters, pagination, and sorting.
 */
export const aggregateAttendanceData = async (
    addFeilds: Record<string, any>,
    matchFilter: Record<string, any>,
    skip: number,
    limit: number,
    sort: Record<string, any>
): Promise<AttendanceToShow[]> => {
    logFunctionInfo("aggregateAttendanceData", FunctionStatus.start);

    try {
        return await Attendance.aggregate([
            { $addFields: addFeilds, },
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
            { $sort: sort },
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
        ]) as AttendanceToShow[];
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}


/**
 * Fetches attendance data from the database with pagination, filtering, and sorting.
 * Also fetching the page info(total pages, pagesize, total data, current page).
 */
export const fetchAttendanceData = async (page: number, limit: number, query: AttendanceQuery, sort: AttendanceSortArgs): Promise<AttendanceFetchResult | null> => {
    const functionName = 'fetchAttendanceData';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        validateAttendanceQuery(query);

        const skip = calculatePageSkip(page, limit);

        const matchFilter = prepareMatchFilter(query);

        const addFeilds = prepareAddFeilds(query);

        const attendances: AttendanceToShow[] = await aggregateAttendanceData(addFeilds, matchFilter, skip, limit, JSON.parse(sort));

        const totalItems = await getAttendnaceFilterCount(addFeilds, matchFilter);
        const totalPages = Math.ceil(totalItems / limit);

        const fetchResult: AttendanceFetchResult = {
            page,
            pageSize: limit,
            totalPages,
            totalItems,
            data: attendances
        }

        logFunctionInfo(functionName, FunctionStatus.success);
        return attendances.length > 0 ? fetchResult : null;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 * Fetches attendance summary by aggregating,
 * needs a userId and date range for calculations
*/
export const findAttendanceSummary = async (query: AttendanceSummaryQuery, summaryType: FetchType): Promise<AttendanceSummary | null> => {
    const functionName = "findAttendanceSummary";
    logFunctionInfo(functionName, FunctionStatus.start);

    const { userId, endDate, startDate } = query
    try {

        const dateDange = getDateRange(startDate, endDate);
        const matchFilter: any = {
            userId: new Types.ObjectId(userId),
            punchIn: {
                $gte: dateDange[0],
                $lte: dateDange[1]
            }
        }

        if (summaryType == FetchType.active) {
            matchFilter["isDeleted"] = false;
        }
        else if (summaryType == FetchType.trash) {
            matchFilter["isDeleted"] = true;
        }

        const attendanceSummary: AttendanceSummary[] = await Attendance.aggregate([
            // Stage1:Matching  with the date range
            { $match: matchFilter },

            // Stage 2: Project required fields and calculate working hours
            {
                $project: {
                    userId: 1,
                    date: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: { $dateFromString: { dateString: "$punchIn" } }
                        }
                    },
                    workingHours: {
                        $cond: {
                            if: {
                                $and: [
                                    { $ne: ["$punchOut", null] },
                                    { $ne: ["$punchIn", null] }
                                ]
                            },
                            then: {
                                $divide: [
                                    {
                                        $subtract: [
                                            { $dateFromString: { dateString: "$punchOut" } },
                                            { $dateFromString: { dateString: "$punchIn" } }
                                        ]
                                    },
                                    3600000 // Convert milliseconds to hours (1000 * 60 * 60)
                                ]
                            },
                            else: 0
                        }
                    },
                    punchOutMissing: {
                        $cond: {
                            if: { $eq: ["$punchOut", null] },
                            then: true,
                            else: false
                        }
                    }
                }
            },

            // Stage 3: Group by userId and calculate metrics
            {
                $group: {
                    _id: "$userId",
                    totalDays: { $sum: 1 },
                    totalHours: { $sum: "$workingHours" },
                    missedPunchOuts: {
                        $sum: {
                            $cond: ["$punchOutMissing", 1, 0]
                        }
                    }
                }
            },

            // Stage 4: Format the final output
            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    totalDays: 1,
                    totalHours: { $round: ["$totalHours", 2] },
                    missedPunchOuts: 1
                }
            }
        ]);

        logFunctionInfo(functionName, FunctionStatus.success);
        return attendanceSummary.length > 0 ? attendanceSummary[0] : null;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}

/**
 * to get Attendnace Data using its unique id
 */
export const getAttendnaceDataById = async (id: string): Promise<AttendanceToShow | null> => {
    const functionName = getAttendnaceDataById.name;
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const match: any = { _id: new Types.ObjectId(id), isDeleted: false };
        const attendanceData = await aggregateAttendanceData({}, match, 0, 1, { createAt: 1 });
        logFunctionInfo(functionName, FunctionStatus.success);

        if (attendanceData.length <= 0) return null;
        else return attendanceData[0];
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}