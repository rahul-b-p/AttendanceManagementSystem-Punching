import { NextFunction, Response } from "express";
import { customRequestWithPayload } from "../interfaces";
import { Adress, CreateOfficeInputBody, Location, OfficeFilterBody, UpdateOfficeArgs, updateOfficeInputBody } from "../types";
import { isValidObjectId, validateAdressWithLocation } from "../validators";
import { getOfficeSortArgs, logger, pagenate, sendCustomResponse } from "../utils";
import { BadRequestError, ConflictError, NotFoundError } from "../errors";
import { fetchOffices, findOfficeById, insertOffice, updateOfficeById, validateLocationUniqueness } from "../services";





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

export const updateOffice = async (req: customRequestWithPayload<{ id: string }, any, updateOfficeInputBody>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) throw new BadRequestError("Invalid Id Provided");

        const existingOffice = await findOfficeById(id);
        if (!existingOffice) throw new NotFoundError("Requested Office not found!");

        const { officeName, street, city, state, zip_code, latitude, longitude, radius } = req.body;

        const adress: Adress = existingOffice.adress;
        if (street || city || state || zip_code) {
            let updateAdress: Partial<Adress> = { street, city, state, zip_code };
            Object.keys(updateAdress).forEach((item) => {
                const key = item as keyof Adress;
                if (updateAdress[key] !== undefined) {
                    adress[key] = updateAdress[key]!;
                }
            });
        }

        const location: Location = existingOffice.location;
        if (latitude || longitude) {
            if (existingOffice.location.latitude !== latitude && existingOffice.location.longitude !== longitude) {
                let updateLocation: Partial<Location> = { latitude, longitude };
                Object.keys(updateLocation).forEach((item) => {
                    const key = item as keyof Location;
                    if (updateLocation[key] !== undefined) {
                        location[key] = updateLocation[key]!;
                    }
                });



                const isUniqueLocation = await validateLocationUniqueness(location);
                if (!isUniqueLocation) throw new ConflictError("Already an office exists on the location");
            }
        }

        const isValidLocation = await validateAdressWithLocation(adress, location);
        if (!isValidLocation) throw new BadRequestError("Location not Match with Inputed Adress");



        const updateOfficeData: UpdateOfficeArgs = { adress, location, officeName, radius }
        const updatedOffice = await updateOfficeById(id, updateOfficeData);

        res.status(200).json(await sendCustomResponse("Office Updated Successfully", updatedOffice));
    } catch (error) {
        logger.error(error);
        next(error);
    }
}