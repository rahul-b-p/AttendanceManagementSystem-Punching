import { startSession, Types } from "mongoose";
import { FetchType, FunctionStatus, OfficeSortArgs, Roles } from "../enums";
import { IOffice } from "../interfaces";
import { Attendance, Office, User } from "../models"
import { InsertOfficeArgs, Location, OfficeFetchResult, officeQuery, UpdateOfficeArgs, OfficeWithUserData, LocationWithRadius } from "../types";
import { logFunctionInfo, logger } from "../utils";
import { updateUserById } from "./user.service";
import { errorMessage } from "../constants";



/**
 * Checks wether the location is unique on database
 */
export const validateLocationUniqueness = async (location: Location): Promise<Boolean> => {
    const functionName = 'validateLocationUniqueness';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const officeExistsOnLocation = await Office.exists({ location, isDeleted: false });

        logFunctionInfo(functionName, FunctionStatus.success);
        return officeExistsOnLocation === null
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 * Insert a new office with required feilds
 */
export const insertOffice = async (officeData: InsertOfficeArgs): Promise<IOffice> => {
    const functionName = 'insertOffice';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const newOffice = new Office(officeData);

        await newOffice.save()

        delete (newOffice as any).__v;
        logFunctionInfo(functionName, FunctionStatus.success);
        return newOffice
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 * Fetches office data using aggregation with support for filtering, sorting, and pagination.
 */
export const fetchOffices = async (fetchType: FetchType, page: number, limit: number, query: officeQuery, sort: OfficeSortArgs, officeName?: string): Promise<OfficeFetchResult | null> => {
    const functionName = 'fetchOffices';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const skip = (page - 1) * limit;

        let matchFilter: any = {};
        switch (fetchType) {
            case FetchType.active:
                matchFilter["isDeleted"] = false;
                break;

            case FetchType.trash:
                matchFilter["isDeleted"] = true;
                break;
        }

        if (query.city) {
            matchFilter["adress.city"] = query.city;
        }
        if (query.state) {
            matchFilter["adress.state"] = query.state;
        }

        if (officeName) {
            matchFilter["officeName"] = { $regex: officeName, $options: "i" };
        }

        const totalFilter = await Office.aggregate([
            { $match: matchFilter },
            { $count: 'totalCount' }
        ]);

        const totalItems = totalFilter.length > 0 ? totalFilter[0].totalCount : 0;

        const offices: OfficeWithUserData[] = await Office.aggregate([
            { $match: matchFilter },
            { $sort: JSON.parse(sort) },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: 'managers',
                    foreignField: '_id',
                    as: 'managers',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'employees',
                    foreignField: '_id',
                    as: 'employees',
                },
            },
            {
                $project: {
                    _id: 1,
                    officeName: 1,
                    adress: 1,
                    location: 1,
                    radius: 1,
                    managers: {
                        _id: 1,
                        username: 1,
                        email: 1,
                        phone: 1,
                        role: 1,
                        verified: 1
                    },
                    employees: {
                        _id: 1,
                        username: 1,
                        email: 1,
                        phone: 1,
                        role: 1,
                        verified: 1
                    },
                    createdAt: 1,
                },
            },
        ]);


        const totalPages = Math.ceil(totalItems / limit);
        const fetchResult: OfficeFetchResult = {
            page,
            pageSize: limit,
            totalPages,
            totalItems,
            data: offices
        };

        logFunctionInfo(functionName, FunctionStatus.success);
        return offices.length > 0 ? fetchResult : null;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 *  Finds an existing office by its unique ID. if not found, then its returns null 
 */
export const findOfficeById = async (_id: string): Promise<IOffice | null> => {
    const functionName = 'findOfficeById';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const office = await Office.findById(_id);
        if (office && office.isDeleted) return null;
        logFunctionInfo(functionName, FunctionStatus.success);
        return office;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 *  Updates an existing office by its unique ID. if not found existing data, then its returns null 
 */
export const updateOfficeById = async (_id: string, updateOfficeData: UpdateOfficeArgs): Promise<IOffice | null> => {
    const functionName = 'updateOfficeById';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const updatedOffice = await Office.findByIdAndUpdate(_id, updateOfficeData, { new: true }).lean();

        delete (updatedOffice as any).__v;

        logFunctionInfo(functionName, FunctionStatus.success);
        return updatedOffice;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 *  Performs soft deletion of office by its unique ID by setting the isDeleted flag true 
 *  @returns {boolean} - Returns `true` if the office exists and the deletion flag is successfully set; `false` if the office with the given ID is not found.
 */
export const softDeleteOfficeById = async (_id: string): Promise<boolean> => {
    const functionName = 'softDeleteOfficeById';
    logFunctionInfo(functionName, FunctionStatus.start);

    const session = await startSession();
    session.startTransaction();
    try {


        const existingOffice = await findOfficeById(_id);
        if (!existingOffice || existingOffice.isDeleted) return false;

        const users = [...existingOffice.managers, ...existingOffice.employees]

        await User.updateMany({ _id: { $in: users } }, { $unset: { officeId: 1 } });

        await Attendance.updateMany({ officeId: _id }, { $set: { isDeleted: true } });

        const deletedOffice = await Office.findByIdAndUpdate(_id, { isDeleted: true });

        await session.commitTransaction();
        session.endSession();

        logFunctionInfo(functionName, FunctionStatus.success);
        if (!deletedOffice) throw Error(errorMessage.OFFICE_NOT_FOUND);
        else return true;
    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();

        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 *  Updates an existing office by its unique ID to assign a user to either the `managers` or `employees` array field based on the provided role.
 */
export const setUserToOfficeById = async (_id: string, userId: string, role: Roles): Promise<IOffice | null> => {
    const functionName = 'setUserToOfficeById';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        if (!userId) {
            throw new Error('UserId must be provided.');
        }

        const updateObject: any = {};
        if (role == Roles.manager) {
            updateObject.managers = userId;
        }
        else if (role == Roles.employee) {
            updateObject.employees = userId;
        }
        else throw new Error(errorMessage.INVALID_OFFICE_USER_ROLE)

        const updatedOffice = await Office.findByIdAndUpdate(_id, {
            $addToSet: updateObject,
        }, { new: true });

        await updateUserById(userId, { $set: { officeId: new Types.ObjectId(_id) } });

        delete (updatedOffice as any).__v;

        logFunctionInfo(functionName, FunctionStatus.success);
        return updatedOffice;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 *  Updates an existing office by its unique ID to remove a user from either the `managers` or `employees` array field based on the provided role.
 */
export const unsetUserFromOfficeById = async (_id: string, userId: string, role: Roles): Promise<IOffice | null> => {
    const functionName = 'unsetUserFromOfficeById';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {

        const updateObject: any = {};
        if (role == Roles.manager) {
            updateObject.managers = userId;
        }
        else if (role == Roles.employee) {
            updateObject.employees = userId;
        }
        else throw new Error(errorMessage.INVALID_OFFICE_USER_ROLE)


        const updatedOffice = await Office.findByIdAndUpdate(_id, {
            $pull: updateObject,
        }, { new: true });

        await updateUserById(userId, { $unset: { officeId: 1 } });

        delete (updatedOffice as any).__v;
        logFunctionInfo(functionName, FunctionStatus.success);
        return updatedOffice;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 *  Deletes an existing attendnace data by its unique id
 *  @returns {boolean} - Returns `true` if the office exists and deleted; `false` if the office with the given ID is not found.
 */
export const deleteOfficeById = async (_id: string): Promise<boolean> => {
    const functionName = 'deleteOfficeById';
    logFunctionInfo(functionName, FunctionStatus.start);

    const session = await startSession();
    session.startTransaction();
    try {


        const trashExistsOnId = await Office.exists({ _id, isDeleted: true });
        if (!trashExistsOnId) return false;

        const deletedOffice = await Office.findByIdAndDelete(_id);

        await Attendance.deleteMany({ officeId: _id });

        await session.commitTransaction();
        session.endSession();

        logFunctionInfo(functionName, FunctionStatus.success);
        return deletedOffice !== null;
    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();

        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 * Checks if a manager is authorized for a given employee by verifying their existence in the same office.
 * The manager must be listed in the `managers` array and the employee in the `employees` array of the same office.
 */
export const isManagerAuthorizedForEmployee = async (employeeId: string, managerId: string): Promise<boolean> => {
    const functionName = 'isManagerAuthorizedForEmployee';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const officeExists = await Office.exists({
            managers: { $in: [managerId] },
            employees: { $in: [employeeId] }
        });

        logFunctionInfo(functionName, FunctionStatus.success);
        return officeExists !== null;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message)
    }
}


/**
 * Fetches locations of all offices as array
 */
export const getAllOfficeLocationsAndRadius = async (): Promise<LocationWithRadius[] | null> => {
    const functionName = 'getAllOfficeLocationsAndRadius';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const officeLocations = await Office.aggregate([
            {
                $match: { isDeleted: false },
            },
            {
                $project: {
                    _id: 1,
                    latitude: "$location.latitude",
                    longitude: "$location.longitude",
                    radius: "$radius",
                },
            }
        ]);

        logFunctionInfo(functionName, FunctionStatus.success);
        if (officeLocations.length <= 0) return null;
        else return officeLocations as LocationWithRadius[]
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}


/**
 * To get All details of an office using its unique id.
 * Fetches the details of users assigned in the office
 */
export const getOfficeDataById = async (_id: string): Promise<IOffice | null> => {
    const functionName = getOfficeDataById.name;
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const officeData = await Office.findOne({ _id, isDeleted: false }).populate({
            path: 'employees',
            select: '-password -refreshToken  -officeId -createdAt -updatedAt -__v'
        }).populate({
            path: 'managers',
            select: '-password -refreshToken -officeId -createdAt -updatedAt -__v'
        }).select('-isDeleted -__v').lean();

        logFunctionInfo(functionName, FunctionStatus.success)
        if (!officeData) return null;
        else return officeData;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message)
    }
}