import { NextFunction, Response } from "express";
import { customRequestWithPayload, IUser } from "../interfaces";
import { Adress, CreateOfficeInputBody, Location, OfficeFilterBody, UpdateOfficeArgs, updateOfficeInputBody } from "../types";
import { isValidObjectId, permissionValidator, validateAdressWithLocation } from "../validators";
import { getOfficeSortArgs, getPermissionSetFromDefaultRoles, logFunctionInfo, pagenate, sendCustomResponse } from "../utils";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../errors";
import { setUserToOfficeById, deleteOfficeById, fetchOffices, findOfficeById, findUserById, insertOffice, updateOfficeById, validateLocationUniqueness, unsetUserFromOfficeById, softDeleteOfficeById, getDefaultRoleFromUserRole, isManagerAuthorizedForEmployee, getOfficeDataById } from "../services";
import { Actions, FetchType, FunctionStatus, Roles } from "../enums";
import { Types } from "mongoose";
import { errorMessage, responseMessage } from "../constants";



/**
 * Controller function to handle the creation of a new office.
 * Requested location should validated by the adress using geoCoder
 * @protected - only admin can access this feature
 */
export const createOffice = async (req: customRequestWithPayload<{}, any, CreateOfficeInputBody>, res: Response, next: NextFunction) => {
    const functionName = 'createOffice';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { officeName, street, city, state, zip_code, latitude, longitude, radius } = req.body;

        const adress: Adress = { street, city, state, zip_code };
        const location: Location = { latitude, longitude };

        const isValidLocation = await validateAdressWithLocation(adress, location);
        if (!isValidLocation) throw new BadRequestError(errorMessage.LOCATION_NOT_MATCHED);

        const isUniqueLocation = await validateLocationUniqueness(location);
        if (!isUniqueLocation) throw new ConflictError(errorMessage.OFFICE_ALREADY_EXISTS_AT_LOCATION);

        const insertedOffice = await insertOffice({ officeName, adress, location, radius });

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(201).json(await sendCustomResponse(responseMessage.OFFICE_CREATED, insertedOffice));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}


/**
 * Controller function to handle the read all offices.
 * @protected - only admin can access this feature
 */
export const readOffices = async (req: customRequestWithPayload<{}, any, any, OfficeFilterBody>, res: Response, next: NextFunction) => {
    const functionName = 'readOffices';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { city, pageLimit, pageNo, sortKey, state, officeName } = req.query;

        const sortArgs = getOfficeSortArgs(sortKey);
        const query = { city, state };

        const fetchResult = await fetchOffices(FetchType.active, Number(pageNo), Number(pageLimit), query, sortArgs, officeName);

        const message = fetchResult ? responseMessage.OFFICE_DATA_FETCHED : errorMessage.OFFICE_DATA_NOT_FOUND;
        let PageNationFeilds;
        if (fetchResult) {
            const { data, ...pageInfo } = fetchResult
            PageNationFeilds = pagenate(pageInfo, req.originalUrl);
        }

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json({
            success: true, message, ...fetchResult, ...PageNationFeilds
        });
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}


/**
 * Controller function to update an existing office.
 * @param - office id
 * @protected - only admin can access this feature
 */
export const updateOffice = async (req: customRequestWithPayload<{ id: string }, any, updateOfficeInputBody>, res: Response, next: NextFunction) => {
    const functionName = 'updateOffice';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) throw new BadRequestError(errorMessage.INVALID_EMAIL_ID);

        const existingOffice = await findOfficeById(id);
        if (!existingOffice) throw new NotFoundError(errorMessage.OFFICE_NOT_FOUND);

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
                if (!isUniqueLocation) throw new ConflictError(errorMessage.OFFICE_ALREADY_EXISTS_AT_LOCATION);
            }
        }

        const isValidLocation = await validateAdressWithLocation(adress, location);
        if (!isValidLocation) throw new BadRequestError(errorMessage.LOCATION_NOT_MATCHED);



        const updateOfficeData: UpdateOfficeArgs = { adress, location, officeName, radius }
        const updatedOffice = await updateOfficeById(id, updateOfficeData);

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse(responseMessage.OFFICE_UPDATED, updatedOffice));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
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
    const functionName = 'deleteOffice';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) throw new BadRequestError(errorMessage.INVALID_ID);

        const isDeleted = await softDeleteOfficeById(id);
        if (!isDeleted) throw new NotFoundError(errorMessage.OFFICE_NOT_FOUND);

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse(responseMessage.OFFICE_DELETED));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
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
    const functionName = 'assignToOffice';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const reqOwnerId = req.payload?.id as string;
        const reqOwner = await findUserById(reqOwnerId) as IUser;
        const reqOwnerRole = await getDefaultRoleFromUserRole(reqOwner.role);

        const { officeId, userId, role } = req.params;
        const isValidOfficeId = isValidObjectId(officeId);
        const isValidUserID = isValidObjectId(userId);
        if (!isValidOfficeId || !isValidUserID) throw new BadRequestError(errorMessage.INVALID_ID);

        const existingOffice = await findOfficeById(officeId);
        if (!existingOffice) throw new NotFoundError(errorMessage.OFFICE_NOT_FOUND);

        if (role == Roles.manager) {
            if (reqOwnerRole !== Roles.admin) throw new ForbiddenError(errorMessage.INSUFFICIENT_PRIVILEGES);

            const managerData = await findUserById(userId);
            if (!managerData) throw new NotFoundError(errorMessage.USER_NOT_FOUND);
            const managerDataDefaultRole = await getDefaultRoleFromUserRole(managerData.role);

            if (managerData.officeId && managerData.officeId.toString() == officeId) throw new ConflictError(errorMessage.USER_ALREADY_IN_OFFICE);
            else if (managerData.officeId) throw new ConflictError(errorMessage.USER_IN_OTHER_OFFICE);

            const managerPermit = getPermissionSetFromDefaultRoles(Roles.manager, Roles.admin);

            if (managerDataDefaultRole !== Roles.manager) {
                const permitted = await Promise.all(Object.values(Actions).map((item) => {
                    return permissionValidator(managerPermit, managerData.role, item);
                }));

                if (permitted.includes(false)) throw new ForbiddenError(errorMessage.NOT_PERMITTED_AS_MANAGER);
            }
        }

        else if (role == Roles.employee) {
            if (reqOwnerRole !== Roles.admin) {
                if (!reqOwner.officeId) throw new ForbiddenError(errorMessage.NO_OFFICE_ASSIGNMENT);
            }
            const employeeData = await findUserById(userId);
            if (!employeeData) throw new NotFoundError(errorMessage.USER_NOT_FOUND);

            if (employeeData.officeId && employeeData.officeId.toString() == officeId) throw new ConflictError(errorMessage.USER_ALREADY_IN_OFFICE);
            else if (employeeData.officeId) throw new ConflictError(errorMessage.USER_IN_OTHER_OFFICE);

        }
        else throw new BadRequestError(errorMessage.INVALID_OFFICE_USER_ROLE);

        const assignedOfficeBody = await setUserToOfficeById(officeId, userId, role);

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse(responseMessage.USER_ASSIGNED_TO_OFFICE, assignedOfficeBody));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
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
    const functionName = 'removeFromOffice';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const reqOwnerId = req.payload?.id as string;
        const reqOwner = await findUserById(reqOwnerId) as IUser;
        const reqOwnerRole = await getDefaultRoleFromUserRole(reqOwner.role);

        const { officeId, role, userId } = req.params;

        const isValidOfficeId = isValidObjectId(officeId);
        const isValidUserId = isValidObjectId(userId);
        if (!isValidOfficeId || !isValidUserId) throw new BadRequestError(errorMessage.INVALID_ID);

        const existingOffice = await findOfficeById(officeId);
        if (!existingOffice) throw new NotFoundError(errorMessage.OFFICE_NOT_FOUND);

        if (reqOwnerRole == Roles.manager) {
            const isAuthorized = isManagerAuthorizedForEmployee(userId, reqOwnerId);
            if (!isAuthorized || role == Roles.manager) throw new ForbiddenError(errorMessage.INSUFFICIENT_PRIVILEGES);
        }

        if (role == Roles.manager) {
            if (!existingOffice.managers.includes(new Types.ObjectId(userId))) throw new NotFoundError(errorMessage.MANAGER_NOT_FOUND_IN_OFFICE);
        }

        else if (role == Roles.employee) {
            if (!existingOffice.employees.includes(new Types.ObjectId(userId))) throw new NotFoundError(errorMessage.EMPLOYEE_NOT_FOUND_IN_OFFICE);
        }

        else throw new BadRequestError(errorMessage.INVALID_OFFICE_USER_ROLE);

        const userRemovedOfficeBody = await unsetUserFromOfficeById(officeId, userId, role);

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse(responseMessage.USER_REMOVED_FROM_OFFICE, userRemovedOfficeBody));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}


/**
 * Controller function to fetch office trash data
 * @protected - only admin can access this feature
 */
export const fetchOfficeTrash = async (req: customRequestWithPayload<{}, any, any, OfficeFilterBody>, res: Response, next: NextFunction) => {
    const functionName = 'fetchOfficeTrash';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { city, pageLimit, pageNo, sortKey, state } = req.query;

        const sortArgs = getOfficeSortArgs(sortKey);
        const query = { city, state };

        const fetchResult = await fetchOffices(FetchType.trash, Number(pageNo), Number(pageLimit), query, sortArgs);

        const message = fetchResult ? responseMessage.OFFICE_TRASH_DATA_FETCHED : errorMessage.TRASH_EMPTY;
        let PageNationFeilds;
        if (fetchResult) {
            const { data, ...pageInfo } = fetchResult
            PageNationFeilds = pagenate(pageInfo, req.originalUrl);
        }

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json({
            success: true, message: message, ...fetchResult, ...PageNationFeilds
        });
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}



/**
 * Controller function to delete office trash data
 * @protected - only admin can access this feature
 */
export const deleteOfficeTrash = async (req: customRequestWithPayload<{ id: string }>, res: Response, next: NextFunction) => {
    const functionName = 'deleteOfficeTrash';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) throw new BadRequestError(errorMessage.INVALID_ID);

        const isDeleted = await deleteOfficeById(id);
        if (!isDeleted) throw new NotFoundError(errorMessage.OFFICE_NOT_FOUND_IN_TRASH);

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse(responseMessage.OFFICE_DATA_DELETED_FROM_TRASH));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error);
        next(error);
    }
}


/**
 * Controller Function to fetch complete details onf an office using its unique id
 *  @protected - only admin can access this feature
 */
export const readOfficeById = async (req: customRequestWithPayload<{ id: string }>, res: Response, next: NextFunction) => {
    const functionName = readOfficeById.name;
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) throw new BadRequestError(errorMessage.INVALID_ID);

        const officeData = await getOfficeDataById(id);
        if (!officeData) throw new NotFoundError(errorMessage.OFFICE_NOT_FOUND);

        logFunctionInfo(functionName, FunctionStatus.start);
        res.status(200).json(await sendCustomResponse(responseMessage.OFFICE_DATA_FETCHED, officeData));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error)
    }
}