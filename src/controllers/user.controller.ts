import { NextFunction, Response } from "express";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../errors";
import { getUserSortArgs, logFunctionInfo, logger, pagenate, sendCustomResponse } from "../utils"
import { customRequestWithPayload, IUser } from "../interfaces";
import { UserFilterQuery, UserInsertArgs, userQuery, UserSearchQuery, UserUpdateArgs, UserUpdateBody } from "../types";
import { checkEmailValidity, isValidObjectId, validateRole } from "../validators";
import { deleteUserById, fetchUsers, findUserById, getDefaultRoleFromUserRole, getUserData, insertUser, isManagerAuthorizedForEmployee, sendUserCreationNotification, sendUserUpdationNotification, updateUserById, validateEmailUniqueness } from "../services";
import { FunctionStatus, Roles, UserSortArgs } from "../enums";
import { errorMessage, responseMessage } from "../constants";
import { USER_DATA_NOT_FOUND } from "../constants/error.constants";




/**
 * Controller function to create a new user
 * @protected only admin or manger can access this feature
 * - admin can create user with any role
 * - manager can't create admin privilliaged user
 */
export const createUser = async (req: customRequestWithPayload<{}, any, UserInsertArgs>, res: Response, next: NextFunction) => {
    const functionName = 'createUser';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { email, role } = req.body;

        const isValidRole = await validateRole(role);
        if (!isValidRole) throw new BadRequestError(errorMessage.INVALID_ROLE);

        const reqOwnerId = req.payload?.id as string;
        const reqOwner = await findUserById(reqOwnerId) as IUser;
        const reqOwnerRole = await getDefaultRoleFromUserRole(reqOwner.role);

        const creatingUserRole = await getDefaultRoleFromUserRole(role);

        const userDataToInsert = req.body;

        if (reqOwnerRole == Roles.manager) {
            if (creatingUserRole !== Roles.employee) throw new ForbiddenError(errorMessage.INSUFFICIENT_PRIVILEGES);
            if (!reqOwner.officeId) throw new ForbiddenError(errorMessage.NO_OFFICE_ASSIGNMENT);
            userDataToInsert.officeId = reqOwner.officeId.toString();
        }

        const isValidEmail = await checkEmailValidity(email);
        if (!isValidEmail) throw new BadRequestError(errorMessage.INVALID_EMAIL_ID);

        const isUniqueEmail = await validateEmailUniqueness(email);
        if (!isUniqueEmail) throw new ConflictError(errorMessage.USER_ALREADY_EXISTS);

        const newUser = await insertUser(req.body);
        sendUserCreationNotification(newUser).catch((error) => {
            logger.error(errorMessage.EMAIL_NOT_SENT, error);
        });

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(201).json(await sendCustomResponse(responseMessage.USER_CREATED, newUser));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}


/**
 * Controller function to create a new user
 * Filter the Users by roles
 * @protected only admin or manger can access this feature
 * - admin can read al users
 * - manager can read assigned users only
 */
export const readUsers = async (req: customRequestWithPayload<{}, any, any, UserFilterQuery>, res: Response, next: NextFunction) => {
    const functionName = 'readUsers';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const reqOwnerId = req.payload?.id as string;
        const reqOwner = await findUserById(reqOwnerId) as IUser;
        const reqOwnerRole = await getDefaultRoleFromUserRole(reqOwner.role);

        const { role, pageNo, pageLimit, sortKey } = req.query;

        let query: userQuery = {};

        if (reqOwnerRole !== Roles.admin) {
            if (!reqOwner.officeId) throw new ForbiddenError(errorMessage.NO_OFFICE_ASSIGNMENT);

            query.officeId = reqOwner.officeId;
        }

        if (role) {
            const isValidRole = await validateRole(role);
            if (!isValidRole) throw new BadRequestError(errorMessage.INVALID_ROLE);

            const defaultRole = await getDefaultRoleFromUserRole(role);
            if (reqOwnerRole !== Roles.admin && defaultRole == Roles.admin) throw new ForbiddenError(errorMessage.INSUFFICIENT_PRIVILEGES);

            query.role = role;
        }

        const sort: UserSortArgs = getUserSortArgs(sortKey);

        const fetchResult = await fetchUsers(Number(pageNo), Number(pageLimit), query, sort);

        const message = fetchResult ? responseMessage.USER_DATA_FETCHED : errorMessage.USER_DATA_NOT_FOUND;
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
 * Controller function to update a user
 * @param id user id
 * @protected only admin or manger can access this feature
 * - admin can update user with any role
 * - manager can't update admin privilliaged user
 * - manager can only update users assigned in their manager privilliaged office
 */
export const updateUserByAdmin = async (req: customRequestWithPayload<{ id: string }, any, UserUpdateBody>, res: Response, next: NextFunction) => {
    const functionName = 'updateUserByAdmin';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { email, role } = req.body;

        if (role) {
            const isValidRole = await validateRole(role);
            if (!isValidRole) throw new BadRequestError(errorMessage.INVALID_ROLE);
        }

        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) throw new BadRequestError(errorMessage.INVALID_ROLE);

        const existingUser = await findUserById(id);
        if (!existingUser) throw new NotFoundError(errorMessage.USER_NOT_FOUND);

        const existingUserRole = await getDefaultRoleFromUserRole(existingUser.role);

        const reqOwnerId = req.payload?.id as string;
        const reqOwner = await findUserById(reqOwnerId) as IUser;
        const reqOwnerRole = await getDefaultRoleFromUserRole(reqOwner.role);

        if (reqOwnerRole !== Roles.admin) {
            if (existingUserRole == Roles.admin) throw new ForbiddenError(errorMessage.INSUFFICIENT_PRIVILEGES);

            const isPermitted = await isManagerAuthorizedForEmployee(existingUser._id.toString(), reqOwnerId);
            if (!isPermitted) throw new ForbiddenError(errorMessage.ACCESS_RESTRICTED_TO_ASSIGNED_OFFICE);
        }

        let userUpdateArgs;
        let emailAdress;
        let message;

        if (email) {
            const isValidEmail = await checkEmailValidity(email);
            if (!isValidEmail) throw new BadRequestError(errorMessage.INVALID_EMAIL_ID);

            if (email == existingUser.email) throw new BadRequestError(errorMessage.EMAIL_ALREADY_IN_USE);

            const isUniqueEmail = await validateEmailUniqueness(email);
            if (!isUniqueEmail) throw new ConflictError(errorMessage.USER_ALREADY_EXISTS);
            userUpdateArgs = { $set: { ...req.body, verified: false }, $unset: { refreshToken: 1 } } as UserUpdateArgs;
            emailAdress = [email, existingUser.email] as string[];
            message = `${responseMessage.USER_UPDATED}, ${responseMessage.EMAIL_VERIFICATION_REQUIRED}` as string;
        }
        else {
            userUpdateArgs = { $set: req.body } as UserUpdateArgs;
            emailAdress = [] as string[];
            message = responseMessage.USER_UPDATED as string;
        }

        const updatedUser = await updateUserById(id, userUpdateArgs);
        if (updatedUser) {
            Promise.all(emailAdress.map((adress) => {
                sendUserUpdationNotification(adress, updatedUser, existingUser.email)
            })).catch((err) => {
                logger.error(err);
            })
        }

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json({ ...await sendCustomResponse(message, updatedUser), verifyLink: email ? '/auth/login' : undefined });
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}


/**
 * Controller function to delete a user
 * @param id user id
 * @protected only admin or manger can access this feature
 * - admin can create user with any role
 * - manager can't create admin privilliaged user
 * - manager can only update users assigned in their manager privilliaged office
 */
export const deleteUserByAdmin = async (req: customRequestWithPayload<{ id: string }>, res: Response, next: NextFunction) => {
    const functionName = 'deleteUserByAdmin';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) throw new BadRequestError(errorMessage.INVALID_ID);

        const existingUser = await findUserById(id);
        if (!existingUser) throw new NotFoundError(errorMessage.USER_NOT_FOUND);
        const existingUserRole = await getDefaultRoleFromUserRole(existingUser.role);

        const reqOwnerId = req.payload?.id as string;
        const reqOwner = await findUserById(reqOwnerId) as IUser;
        const reqOwnerRole = await getDefaultRoleFromUserRole(reqOwner.role);

        if (reqOwnerRole !== Roles.admin) {
            if (existingUserRole == Roles.admin) throw new ForbiddenError(errorMessage.INSUFFICIENT_PRIVILEGES);

            const isPermitted = await isManagerAuthorizedForEmployee(existingUser._id.toString(), reqOwnerId);
            if (!isPermitted) throw new ForbiddenError(errorMessage.ACCESS_RESTRICTED_TO_ASSIGNED_OFFICE);
        }


        await deleteUserById(id);
        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse(responseMessage.USER_DELETED));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}

/**
 * Controller function to search and read users
 * Filter and Search the Users by roles
 * @protected only admin or manger can access this feature
 * - admin can search al users
 * - manager can search assigned users only
 */
export const searchAndFilterUser = async (req: customRequestWithPayload<{}, any, any, UserFilterQuery & UserSearchQuery>, res: Response, next: NextFunction) => {
    const functionName = 'searchAndFilterUser';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const reqOwnerId = req.payload?.id as string;
        const reqOwner = await findUserById(reqOwnerId) as IUser;
        const reqOwnerRole = await getDefaultRoleFromUserRole(reqOwner.role);

        const { role, pageNo, pageLimit, sortKey, username } = req.query;

        let query: userQuery = {};

        if (reqOwnerRole !== Roles.admin) {
            if (!reqOwner.officeId) throw new ForbiddenError(errorMessage.NO_OFFICE_ASSIGNMENT);

            query.officeId = reqOwner.officeId;
        }

        if (role) {
            const isValidRole = await validateRole(role);
            if (!isValidRole) throw new BadRequestError(errorMessage.INVALID_ROLE);

            const defaultRole = await getDefaultRoleFromUserRole(role);
            if (reqOwnerRole !== Roles.admin && defaultRole == Roles.admin) throw new ForbiddenError(errorMessage.INSUFFICIENT_PRIVILEGES);

            query.role = role;
        }

        const sort: UserSortArgs = getUserSortArgs(sortKey);

        const fetchResult = await fetchUsers(Number(pageNo), Number(pageLimit), query, sort, username);

        const message = fetchResult ? responseMessage.USER_DATA_FETCHED : USER_DATA_NOT_FOUND;
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
 * Controller function to read a specific user
 * @param id user id
 * @protected only admin or manger can access this feature
 * - admin read any user
 * - manager only read manager privilliaged office employees
 */
export const readUserDataByAdmin = async (req: customRequestWithPayload<{ id: string }>, res: Response, next: NextFunction) => {
    const functionName = 'readUserDataByAdmin';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const reqOwnerId = req.payload?.id as string;
        const reqOwner = await findUserById(reqOwnerId) as IUser;
        const reqOwnerRole = await getDefaultRoleFromUserRole(reqOwner.role);

        const { id } = req.params;
        const existingUser = await getUserData(id);

        if (!existingUser) throw new NotFoundError(errorMessage.USER_NOT_FOUND);

        const existingUserRole = await getDefaultRoleFromUserRole(existingUser.role);
        if (reqOwnerRole !== Roles.admin) {
            if (existingUserRole == Roles.admin) throw new ForbiddenError(errorMessage.INSUFFICIENT_PRIVILEGES);

            const isAuthorizedManager = await isManagerAuthorizedForEmployee(id, reqOwnerId);
            if (!isAuthorizedManager) throw new ForbiddenError(errorMessage.ACCESS_RESTRICTED_TO_ASSIGNED_OFFICE);
        }

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse(responseMessage.USER_DATA_FETCHED, existingUser));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}


