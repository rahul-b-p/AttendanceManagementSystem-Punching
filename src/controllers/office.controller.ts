import { NextFunction, Response } from "express";
import { customRequestWithPayload } from "../interfaces";
import { Adress, CreateOfficeInputBody, Location } from "../types";
import { validateAdressWithLocation } from "../validators";
import { logger, sendCustomResponse } from "../utils";
import { BadRequestError, ConflictError } from "../errors";
import { insertOffice, validateLocationUniqueness } from "../services";





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
        next(error)
    }
}