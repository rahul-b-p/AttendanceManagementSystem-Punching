import { OfficeSortArgs } from "../enums";
import { IOffice } from "../interfaces";
import { Office } from "../models"
import { InsertOfficeArgs, Location, OfficeFetchResult, officeQuery } from "../types";
import { logger } from "../utils";


export const validateLocationUniqueness = async (location: Location): Promise<Boolean> => {
    try {
        const officeExistsOnLocation = await Office.exists({ location });
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

export const fetchOffices = async (page: number, limit: number, query: officeQuery, sort: OfficeSortArgs) => {
    try {
        const skip = (page - 1) * limit;

        let matchFilter: any = {};
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

        const offices: IOffice[] = await Office.aggregate([
            { $match: matchFilter },
            { $sort: JSON.parse(sort) },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    officeName: 1,
                    adress: 1,
                    location: 1,
                    radius: 1,
                    managers: 1,
                    employees: 1,
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
