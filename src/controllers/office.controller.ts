import { NextFunction, Response } from "express";
import { customRequestWithPayload } from "../interfaces";
import { Adress, CreateOfficeInputBody, Location, OfficeFilterBody } from "../types";
import { validateAdressWithLocation } from "../validators";
import { getOfficeSortArgs, logger, pagenate, sendCustomResponse } from "../utils";
import { BadRequestError, ConflictError } from "../errors";
import { fetchOffices, insertOffice, validateLocationUniqueness } from "../services";





export const createOffice = async (req: customRequestWithPayload<{}, any, CreateOfficeInputBody>, res: Response, next: NextFunction) => {
    try {
        const { officeName, street, city, state, zip_code, latitude, longitude, radius } = req.body;

        const adress: Adress = { street, city, state, zip_code };
        const location: Location = { latitude, longitude };

        const isValidLocation = await validateAdressWithLocation(adress, location);
        if (!isValidLocation) throw new BadRequestError("Location not Match with Inputed Adress");

        const isUniqueLocation = await validateLocationUniqueness(location);
        if (!isUniqueLocation) throw new ConflictError("Already an office exists on the location");

        const insertedOffice = await insertOffice({ officeName, adress, location, radius });
        res.status(201).json(await sendCustomResponse("New office created successfully", insertedOffice));
    } catch (error) {
        logger.error(error);
        next(error);
    }
}

export const readOffices = async (req: customRequestWithPayload<{}, any, any, OfficeFilterBody>, res: Response, next: NextFunction) => {
    try {
        const { city, pageLimit, pageNo, sortKey, state } = req.query;


        const sortArgs = getOfficeSortArgs(sortKey);
        const query = { city, state };

        const fetchResult = await fetchOffices(Number(pageNo), Number(pageLimit), query, sortArgs);

        const responseMessage = fetchResult ? 'User Data Fetched Successfully' : 'No Users found to show';
        let PageNationFeilds;
        if (fetchResult) {
            const { data, ...pageInfo } = fetchResult
            PageNationFeilds = pagenate(pageInfo, req.originalUrl);
        }

        res.status(200).json({
            success: true, responseMessage, ...fetchResult, ...PageNationFeilds
        });
    } catch (error) {
        logger.error(error);
        next(error);
    }
}