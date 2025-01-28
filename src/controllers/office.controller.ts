import { NextFunction, Response } from "express";
import { customRequestWithPayload, IUser } from "../interfaces";
import { Adress, CreateOfficeInputBody, Location, OfficeFilterBody, UpdateOfficeArgs, updateOfficeInputBody } from "../types";
import { isValidObjectId, permissionValidator, validateAdressWithLocation } from "../validators";
import { getOfficeSortArgs, getPermissionSetFromDefaultRoles, logger, pagenate, sendCustomResponse } from "../utils";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../errors";
import { setUserToOfficeById, deleteOfficeById, fetchOffices, findOfficeById, findUserById, insertOffice, updateOfficeById, validateLocationUniqueness, unsetUserFromOfficeById, softDeleteOfficeById, getDefaultRoleFromUserRole, isManagerAuthorizedForEmployee } from "../services";
import { Actions, FetchType, Roles } from "../enums";
import { Types } from "mongoose";



/**
 * Controller function to handle the creation of a new office.
 * Requested location should validated by the adress using geoCoder
 * @protected - only admin can access this feature
 */
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


/**
 * Controller function to handle the read all offices.
 * @protected - only admin can access this feature
 */
export const readOffices = async (req: customRequestWithPayload<{}, any, any, OfficeFilterBody>, res: Response, next: NextFunction) => {
    try {
        const { city, pageLimit, pageNo, sortKey, state } = req.query;

        const sortArgs = getOfficeSortArgs(sortKey);
        const query = { city, state };

        const fetchResult = await fetchOffices(FetchType.active, Number(pageNo), Number(pageLimit), query, sortArgs);

        const responseMessage = fetchResult ? 'Office Data Fetched Successfully' : 'No Users found to show';
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


/**
 * Controller function to update an existing office.
 * @param - office id
 * @protected - only admin can access this feature
 */
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


/**
 * Controller function to delete an existing office.
 * Its a soft deletion, can found the deleted data on trash.
 * @param - office id
 * @protected - only admin can access this feature
 */
export const deleteOffice = async (req: customRequestWithPayload<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) throw new BadRequestError("Invalid Id Provided");

        const isDeleted = await softDeleteOfficeById(id);
        if (!isDeleted) throw new NotFoundError("Requested office not found!");

        res.status(200).json(await sendCustomResponse("Office Deleted Successfully"));
    } catch (error) {
        logger.error(error);
        next(error);
    }
}


/**
 * Controller function to assign a user as employee or manager in office.
 * @param officeId
 * @param userId
 * @protected  only admin and manager can access this feature
 * - admin: can assign both managers and employees
 * - manager: can assign employees only
 */
export const assignToOffice = async (req: customRequestWithPayload<{ officeId: string, userId: string, role: Roles }>, res: Response, next: NextFunction) => {
    try {
        const reqOwnerId = req.payload?.id as string;
        const reqOwner = await findUserById(reqOwnerId) as IUser;
        const reqOwnerRole = await getDefaultRoleFromUserRole(reqOwner.role);

        const { officeId, userId, role } = req.params;
        const isValidId = isValidObjectId(officeId);
        if (!isValidId) throw new BadRequestError("Requested with an inValid office id");

        const existingOffice = await findOfficeById(officeId);
        if (!existingOffice) throw new NotFoundError("Requested Office not found!");

        if (role == Roles.manager) {
            if (reqOwnerRole !== Roles.admin) throw new ForbiddenError("Insufficient Permission, to add manager to your office");

            const managerData = await findUserById(userId);
            if (!managerData) throw new NotFoundError(`User with ID ${userId} not found to assign as an employee in the office`);
            const managerDataDefaultRole = await getDefaultRoleFromUserRole(managerData.role);

            if (managerData.officeId && managerData.officeId.toString() == officeId) throw new ConflictError("Requested user was alraedy added on this office");
            else if (managerData.officeId) throw new ConflictError("Requested user was already added in other office");

            const managerPermit = getPermissionSetFromDefaultRoles(Roles.manager, Roles.admin);

            if (managerDataDefaultRole !== Roles.manager) {
                const permitted = await Promise.all(Object.values(Actions).map((item) => {
                    return permissionValidator(managerPermit, managerData.role, item);
                }));

                if (permitted.includes(false)) throw new ForbiddenError(`User with ID ${userId} do not permitted to assign as a manager!`);
            }
        }

        else if (role == Roles.employee) {
            if (reqOwnerRole !== Roles.admin) {
                if (!reqOwner.officeId) throw new ForbiddenError("You are not assigned in any office, can't assign employees to office");
            }
            const employeeData = await findUserById(userId);
            if (!employeeData) throw new NotFoundError(`User with ID ${userId} not found to assign as an employee in the office`);

            if (employeeData.officeId && employeeData.officeId.toString() == officeId) throw new ConflictError("Requested user was alraedy added on this office");
            else if (employeeData.officeId) throw new ConflictError("Requested user was already added in other office");

        }
        else throw new BadRequestError("You can assign either  manager or employee to an office");

        const assignedOfficeBody = await setUserToOfficeById(officeId, userId, role);

        res.status(200).json(await sendCustomResponse("Successfully assigned into office", assignedOfficeBody));
    } catch (error) {
        logger.error(error);
        next(error);
    }
}


/**
 * Controller function to remove a user from office.
 * @param officeId
 * @param userId
 * @protected  only admin and manager can access this feature
 * - admin: can remove both managers and employees
 * - manager: can remove employees only
 */
export const removeFromOffice = async (req: customRequestWithPayload<{ officeId: string, userId: string, role: Roles }>, res: Response, next: NextFunction) => {
    try {
        const reqOwnerId = req.payload?.id as string;
        const reqOwner = await findUserById(reqOwnerId) as IUser;
        const reqOwnerRole = await getDefaultRoleFromUserRole(reqOwner.role);

        const { officeId, role, userId } = req.params;

        const isValidId = isValidObjectId(officeId);
        if (!isValidId) throw new BadRequestError("Requested with an inValid office id");

        const existingOffice = await findOfficeById(officeId);
        if (!existingOffice) throw new NotFoundError("Requested Office not found!");

        if (reqOwnerRole == Roles.manager) {
            const isAuthorized = isManagerAuthorizedForEmployee(userId, reqOwnerId);
            if (!isAuthorized || role == Roles.manager) throw new ForbiddenError("User not authorized to you for, take any actions");
        }

        if (role == Roles.manager) {
            if (!existingOffice.managers.includes(new Types.ObjectId(userId))) throw new NotFoundError(`User with Id ${userId} not exists on the given office`);
        }

        else if (role == Roles.employee) {
            if (!existingOffice.employees.includes(new Types.ObjectId(userId))) throw new NotFoundError(`User with Id ${userId} not exists on the given office`);
        }

        else throw new BadRequestError("Only Manager and Employee categories are  accessible in office");

        const userRemovedOfficeBody = await unsetUserFromOfficeById(officeId, userId, role);

        res.status(200).json(await sendCustomResponse("Successfully removed user from the office", userRemovedOfficeBody));
    } catch (error) {
        logger.error(error);
        next(error);
    }
}


/**
 * Controller function to fetch office trash data
 * @protected - only admin can access this feature
 */
export const fetchOfficeTrash = async (req: customRequestWithPayload<{}, any, any, OfficeFilterBody>, res: Response, next: NextFunction) => {
    try {
        const { city, pageLimit, pageNo, sortKey, state } = req.query;

        const sortArgs = getOfficeSortArgs(sortKey);
        const query = { city, state };

        const fetchResult = await fetchOffices(FetchType.trash, Number(pageNo), Number(pageLimit), query, sortArgs);

        const responseMessage = fetchResult ? 'Office Trash Data Fetched Successfully' : 'Your trash is empty';
        let PageNationFeilds;
        if (fetchResult) {
            const { data, ...pageInfo } = fetchResult
            PageNationFeilds = pagenate(pageInfo, req.originalUrl);
        }

        res.status(200).json({
            success: true, message: responseMessage, ...fetchResult, ...PageNationFeilds
        });
    } catch (error) {
        logger.error(error);
        next(error);
    }
}



/**
 * Controller function to delete office trash data
 * @protected - only admin can access this feature
 */
export const deleteOfficeTrash = async (req: customRequestWithPayload<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) throw new BadRequestError("Invalid Id Provided");

        const isDeleted = await deleteOfficeById(id);
        if (!isDeleted) throw new NotFoundError("Requested office not found on trash!");

        res.status(200).json(await sendCustomResponse("Office Data Deleted Successfully from trash"));
    } catch (error) {
        logger.error(error);
        next(error);
    }
}