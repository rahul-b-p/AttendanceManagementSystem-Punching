import { NextFunction, Response } from "express";
import { customRequestWithPayload, IUser } from "../interfaces";
import { Adress, AssignToOfficeBody, CreateOfficeInputBody, Location, OfficeFilterBody, UpdateOfficeArgs, updateOfficeInputBody } from "../types";
import { isValidObjectId, permissionValidator, validateAdressWithLocation, validateRole } from "../validators";
import { getAction, getOfficeSortArgs, getPermissionSetFromDefaultRoles, logger, pagenate, sendCustomResponse } from "../utils";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../errors";
import { assignToOfficeById, deleteOfficeById, fetchOffices, findOfficeById, findUserById, insertOffice, updateOfficeById, validateLocationUniqueness } from "../services";
import { Actions, Roles } from "../enums";





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

export const deleteOffice = async (req: customRequestWithPayload<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) throw new BadRequestError("Invalid Id Provided");

        const isDeleted = await deleteOfficeById(id);
        if (!isDeleted) throw new NotFoundError("Requested office not found!");

        res.status(200).json(await sendCustomResponse("Office Deleted Successfully"));
    } catch (error) {
        logger.error(error);
        next(error);
    }
}

export const assignToOffice = async (req: customRequestWithPayload<{ officeId: string }, any, AssignToOfficeBody>, res: Response, next: NextFunction) => {
    try {
        const userId = req.payload?.id as string;
        const exisingUser = await findUserById(userId) as IUser;

        const { officeId } = req.params;
        logger.info(officeId)
        const isValidId = isValidObjectId(officeId);
        if (!isValidId) throw new BadRequestError("Requested with an inValid office id");

        const existingOffice = await findOfficeById(officeId);
        if (!existingOffice) throw new NotFoundError("Requested Office not found!");

        const { employee, manager } = req.body;

        if (manager) {
            const managerData = await findUserById(manager);
            if (!managerData) throw new NotFoundError(`User with ID ${manager} not found to assign as an employee in the office`);

            if(managerData.officeId && managerData.officeId.toString() == officeId) throw new ConflictError("Requested user was alraedy added on this office");
            else if(managerData.officeId) throw new ConflictError("Requested user was already added in other office");

            if (exisingUser.role !== Roles.admin) {
                const permissionSet = getPermissionSetFromDefaultRoles(Roles.admin);
                const action = getAction(req.method);
                const isPermitted = await permissionValidator(permissionSet, exisingUser.role, action);
                if (!isPermitted) throw new ForbiddenError("Insufficent role privilleages");
            }

            const managerPermit = getPermissionSetFromDefaultRoles(Roles.manager);

            if (managerData.role !== Roles.manager) {
                const permitted = await Promise.all(Object.values(Actions).map((item) => {
                    return permissionValidator(managerPermit, managerData.role, item);
                }));

                if (permitted.includes(false)) throw new ForbiddenError(`User with ID ${manager} do not permitted to assign as a manager!`);
            }
        }

        if (employee) {
            const employeeData = await findUserById(employee);
            if (!employeeData) throw new NotFoundError(`User with ID ${manager} not found to assign as an employee in the office`);

            if (employeeData.officeId && employeeData.officeId.toString() == officeId) throw new ConflictError("Requested user was alraedy added on this office");
            else if (employeeData.officeId) throw new ConflictError("Requested user was already added in other office");

        }

        const assignedOfficeBody = await assignToOfficeById(officeId, req.body);

        res.status(200).json(await sendCustomResponse("Successfully assigned into office", assignedOfficeBody));
    } catch (error) {
        logger.error(error);
        next(error);
    }
}