import { Types } from "mongoose";
import { FetchType, OfficeSortArgs, Roles } from "../enums";
import { IOffice } from "../interfaces";
import { Office } from "../models"
import { InsertOfficeArgs, Location, OfficeFetchResult, officeQuery, UpdateOfficeArgs, OfficeWithUserData } from "../types";
import { logger } from "../utils";
import { updateUserById } from "./user.service";


export const validateLocationUniqueness = async (location: Location): Promise<Boolean> => {
    try {
        const officeExistsOnLocation = await Office.exists({ location, isDeleted: false });
        return officeExistsOnLocation === null
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const insertOffice = async (officeData: InsertOfficeArgs): Promise<IOffice> => {
    try {
        const newOffice = new Office(officeData);

        await newOffice.save()

        delete (newOffice as any).__v;
        return newOffice
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const fetchOffices = async (fetchType: FetchType, page: number, limit: number, query: officeQuery, sort: OfficeSortArgs): Promise<OfficeFetchResult | null> => {
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

        return offices.length > 0 ? fetchResult : null;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const findOfficeById = async (_id: string): Promise<IOffice | null> => {
    try {
        return await Office.findById(_id);
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const updateOfficeById = async (_id: string, updateOfficeData: UpdateOfficeArgs): Promise<IOffice | null> => {
    try {
        const updatedOffice = await Office.findByIdAndUpdate(_id, updateOfficeData, { new: true }).lean();

        delete (updatedOffice as any).__v;

        return updatedOffice;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const softDeleteOfficeById = async (_id: string): Promise<boolean> => {
    try {
        const existingOffice = await findOfficeById(_id);
        if (!existingOffice || existingOffice.isDeleted) return false;

        const users = [...existingOffice.managers, ...existingOffice.employees]
        await Promise.all(users.map((userId) => {
            updateUserById(userId.toString(), { $unset: { officeId: 1 } });
        }));

        const deletedOffice = await Office.findByIdAndUpdate(_id, { isDeleted: true });
        if (!deletedOffice) throw Error("existingOffice Can't find while deletion");
        else return true;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const setUserToOfficeById = async (_id: string, userId: string, role: Roles): Promise<IOffice | null> => {
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
        else throw new Error(`Can only assign manger or employee to an office model`)

        const updatedOffice = await Office.findByIdAndUpdate(_id, {
            $addToSet: updateObject,
        }, { new: true });

        await updateUserById(userId, { $set: { officeId: new Types.ObjectId(_id) } });

        delete (updatedOffice as any).__v;
        return updatedOffice;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const unsetUserFromOfficeById = async (_id: string, userId: string, role: Roles): Promise<IOffice | null> => {
    try {
        if (!userId) throw new Error('UserId must be provided.');

        const updateObject: any = {};
        if (role == Roles.manager) {
            updateObject.managers = userId;
        }
        else if (role == Roles.employee) {
            updateObject.employees = userId;
        }
        else throw new Error(`Can only assign manger or employee to an office model`)


        const updatedOffice = await Office.findByIdAndUpdate(_id, {
            $pull: updateObject,
        }, { new: true });

        await updateUserById(userId, { $unset: { officeId: 1 } });

        delete (updatedOffice as any).__v;
        return updatedOffice;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const deleteOfficeById = async (_id: string): Promise<boolean> => {
    try {
        const trashExistsOnId = await Office.exists({ _id, isDeleted: true });
        if (!trashExistsOnId) return false;

        const deletedOffice = await Office.findByIdAndDelete(_id);
        return deletedOffice !== null;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}

export const isManagerAuthorizedForEmployee = async (employeeId: string, managerId: string): Promise<boolean> => {
    try {
        const officeExists = await Office.exists({
            managers: { $in: [managerId] },
            employees: { $in: [employeeId] }
        });
        return officeExists !== null;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message)
    }
}