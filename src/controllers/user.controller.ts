import { NextFunction, Response } from "express";
import { BadRequestError, ConflictError, ForbiddenError, InternalServerError, NotFoundError } from "../errors";
import { getUserSortArgs, logger, pagenate, sendCustomResponse } from "../utils"
import { customRequestWithPayload, IUser } from "../interfaces";
import { UserFilterQuery, UserInsertArgs, userQuery, UserSearchQuery, UserUpdateArgs, UserUpdateBody } from "../types";
import { checkEmailValidity, isValidObjectId, validateRole } from "../validators";
import { deleteUserById, fetchUsers, findUserById, getDefaultRoleFromUserRole, getUserData, insertUser, isManagerAuthorizedForEmployee, sendUserCreationNotification, sendUserUpdationNotification, updateUserById, validateEmailUniqueness } from "../services";
import { Roles, UserSortArgs } from "../enums";




/**
 * Controller function to create a new user
 * @protected only admin or manger can access this feature
 * - admin can create user with any role
 * - manager can't create admin privilliaged user
 */
export const createUser = async (req: customRequestWithPayload<{}, any, UserInsertArgs>, res: Response, next: NextFunction) => {
    try {
        const { email, role } = req.body;

        const isValidRole = await validateRole(role);
        if (!isValidRole) return next(new BadRequestError("Invalid Role Provided"));

        const reqOwnerId = req.payload?.id as string;
        const reqOwner = await findUserById(reqOwnerId) as IUser;
        const reqOwnerRole = await getDefaultRoleFromUserRole(reqOwner.role);

        const creatingUserRole = await getDefaultRoleFromUserRole(role);

        const userDataToInsert = req.body;

        if (reqOwnerRole == Roles.manager) {
            if (creatingUserRole !== Roles.employee) return next(new ForbiddenError('Forbidden: Insufficient role privileges'));
            if (!reqOwner.officeId) return next(new ForbiddenError("You are not assigned to any office, can't take any action"));
            userDataToInsert.officeId = reqOwner.officeId.toString();
        }

        const isValidEmail = await checkEmailValidity(email);
        if (!isValidEmail) return next(new BadRequestError("Invalid Email Id"));

        const isUniqueEmail = await validateEmailUniqueness(email);
        if (!isUniqueEmail) return next(new ConflictError("User already exists!"));

        const newUser = await insertUser(req.body);
        sendUserCreationNotification(newUser).catch((error) => {
            logger.error("Error sending email:", error);
        });

        res.status(201).json(await sendCustomResponse("New User Created Successfully", newUser));
    } catch (error) {
        logger.error(error);
        next(new InternalServerError());
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
    try {
        const reqOwnerId = req.payload?.id as string;
        const reqOwner = await findUserById(reqOwnerId) as IUser;
        const reqOwnerRole = await getDefaultRoleFromUserRole(reqOwner.role);

        const { role, pageNo, pageLimit, sortKey } = req.query;

        let query: userQuery = {};

        if (reqOwnerRole !== Roles.admin) {
            if (!reqOwner.officeId) throw new ForbiddenError("You are not assigned in any office can't access any user data!");

            query.officeId = reqOwner.officeId;
        }

        if (role) {
            const isValidRole = await validateRole(role);
            if (!isValidRole) throw new BadRequestError("Invalid role provided!");

            const defaultRole = await getDefaultRoleFromUserRole(role);
            if (reqOwnerRole !== Roles.admin && defaultRole == Roles.admin) throw new ForbiddenError("Insufficient role privilliages to take an action");

            query.role = role;
        }

        const sort: UserSortArgs = getUserSortArgs(sortKey);

        const fetchResult = await fetchUsers(Number(pageNo), Number(pageLimit), query, sort);

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


/**
 * Controller function to update a user
 * @param id user id
 * @protected only admin or manger can access this feature
 * - admin can update user with any role
 * - manager can't update admin privilliaged user
 * - manager can only update users assigned in their manager privilliaged office
 */
export const updateUserByAdmin = async (req: customRequestWithPayload<{ id: string }, any, UserUpdateBody>, res: Response, next: NextFunction) => {
    try {
        const { email, role } = req.body;

        if (role) {
            const isValidRole = await validateRole(role);
            if (!isValidRole) return next(new BadRequestError("Invalid Role Provided"));
        }

        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) return next(new BadRequestError("Invalid User Id"));

        const existingUser = await findUserById(id);
        if (!existingUser) return next(new NotFoundError("Requested user not found!"));

        const reqOwnerId = req.payload?.id as string;
        const reqOwner = await findUserById(reqOwnerId) as IUser;
        const reqOwnerRole = await getDefaultRoleFromUserRole(reqOwner.role);

        if (reqOwnerRole !== Roles.admin) {
            if (existingUser.role == Roles.admin) return next(new ForbiddenError('Forbidden: Insufficient role privileges'));

            const isPermitted = await isManagerAuthorizedForEmployee(existingUser._id.toString(), reqOwnerId);
            if (!isPermitted) throw new ForbiddenError('You can Only Access Employees of Assigned office');
        }

        let userUpdateArgs;
        let emailAdress;
        let responseMessage;

        if (email) {
            const isValidEmail = await checkEmailValidity(email);
            if (!isValidEmail) return next(new BadRequestError("Invalid Email Id"));

            if (email == existingUser.email) return next(new BadRequestError("The email address you entered is already your current email."));

            const isUniqueEmail = await validateEmailUniqueness(email);
            if (!isUniqueEmail) return next(new ConflictError("User already exists!"));
            userUpdateArgs = { $set: { ...req.body, verified: false }, $unset: { refreshToken: 1 } } as UserUpdateArgs;
            emailAdress = [email, existingUser.email] as string[];
            responseMessage = "your account has been updated, need Email verification" as string;
        }
        else {
            userUpdateArgs = { $set: req.body } as UserUpdateArgs;
            emailAdress = [] as string[];
            responseMessage = "Your account has been updated successfully" as string;
        }

        const updatedUser = await updateUserById(id, userUpdateArgs);
        if (updatedUser) {
            Promise.all(emailAdress.map((adress) => {
                sendUserUpdationNotification(adress, updatedUser, existingUser.email)
            })).catch((err) => {
                logger.error(err);
            })
        }

        res.status(200).json({ ...await sendCustomResponse(responseMessage, updatedUser), verifyLink: email ? '/auth/login' : undefined });
    } catch (error) {
        logger.error(error);
        next(new InternalServerError());
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
    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) return next(new BadRequestError("Invalid User Id"));

        const existingUser = await findUserById(id);
        if (!existingUser) return next(new NotFoundError("Requested user not found!"));
        const existingUserRole = await getDefaultRoleFromUserRole(existingUser.role);

        const reqOwnerId = req.payload?.id as string;
        const reqOwner = await findUserById(reqOwnerId) as IUser;
        const reqOwnerRole = await getDefaultRoleFromUserRole(reqOwner.role);
        if (existingUserRole == Roles.admin && reqOwnerRole !== Roles.admin) return next(new ForbiddenError('Forbidden: Insufficient role privileges'));

        await deleteUserById(id);
        res.status(200).json(await sendCustomResponse("User Deleted Successfully"));
    } catch (error) {
        logger.info(error);
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
    try {
        const reqOwnerId = req.payload?.id as string;
        const reqOwner = await findUserById(reqOwnerId) as IUser;
        const reqOwnerRole = await getDefaultRoleFromUserRole(reqOwner.role);

        const { role, pageNo, pageLimit, sortKey, username } = req.query;

        let query: userQuery = {};

        if (reqOwnerRole !== Roles.admin) {
            if (!reqOwner.officeId) throw new ForbiddenError("You are not assigned in any office can't access any user data!");

            query.officeId = reqOwner.officeId;
        }

        if (role) {
            const isValidRole = await validateRole(role);
            if (!isValidRole) throw new BadRequestError("Invalid role provided!");

            const defaultRole = await getDefaultRoleFromUserRole(role);
            if (reqOwnerRole !== Roles.admin && defaultRole == Roles.admin) throw new ForbiddenError("Insufficient role privilliages to take an action");

            query.role = role;
        }

        const sort: UserSortArgs = getUserSortArgs(sortKey);

        const fetchResult = await fetchUsers(Number(pageNo), Number(pageLimit), query, sort, username);

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
        logger.info(error);
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
    try {
        const reqOwnerId = req.payload?.id as string;
        const reqOwner = await findUserById(reqOwnerId) as IUser;
        const reqOwnerRole = await getDefaultRoleFromUserRole(reqOwner.role);

        const { id } = req.params;
        const existingUser = await getUserData(id);

        if (!existingUser) throw new NotFoundError('User Not Found!');

        const existingUserRole = await getDefaultRoleFromUserRole(existingUser.role);
        if (reqOwnerRole !== Roles.admin) {
            if (existingUserRole == Roles.admin) throw new ForbiddenError("Insufficient role privilliages to take an action");

            const isAuthorizedManager = await isManagerAuthorizedForEmployee(id, reqOwnerId);
            if (!isAuthorizedManager) throw new ForbiddenError("You have not permitted to access the user");
        }

        res.status(200).json(await sendCustomResponse("User Details Fetched", existingUser));
    } catch (error) {
        logger.error(error);
        next(error);
    }
}


/**
 * Controller function to allow a logged-in user to update their own account details.
 * If the user updates their email,
 * the account will need re-verification to confirm the new email address.
 */
export const updateProfile = async (req: customRequestWithPayload<{}, any, UserUpdateBody>, res: Response, next: NextFunction) => {
    try {
        const { role, email } = req.body;
        const id = req.payload?.id as string;
        const existingUser = await findUserById(id) as IUser;


        if (role) {
            const isValidRole = await validateRole(role);
            if (!isValidRole) return next(new BadRequestError("Invalid Role Provided"));

            if (existingUser.role !== Roles.admin) return next(new ForbiddenError('Forbidden: Insufficient role privileges'));
        }


        let userUpdateArgs;
        let emailAdress;
        let responseMessage;
        if (email) {
            const isValidEmail = await checkEmailValidity(email);
            if (!isValidEmail) return next(new BadRequestError("Invalid Email Id"));

            if (email == existingUser.email) return next(new BadRequestError("The email address you entered is already your current email."));

            const isUniqueEmail = await validateEmailUniqueness(email);
            if (!isUniqueEmail) return next(new ConflictError("User already exists!"));
            userUpdateArgs = { $set: { ...req.body, verified: false }, $unset: { refreshToken: 1 } } as UserUpdateArgs;
            emailAdress = [email, existingUser.email] as string[];
            responseMessage = "your account has been updated, need Email verification" as string;
        }
        else {
            userUpdateArgs = { $set: req.body } as UserUpdateArgs;
            emailAdress = [] as string[];
            responseMessage = "Your account has been updated successfully" as string;
        }
        const updatedUser = await updateUserById(id, userUpdateArgs);
        if (updatedUser) {
            Promise.all(emailAdress.map((adress) => {
                sendUserUpdationNotification(adress, updatedUser, existingUser.email)
            })).catch((err) => {
                logger.error(err);
            })
        }

        res.status(200).json({ ...await sendCustomResponse(responseMessage, updatedUser), verifyLink: email ? '/auth/login' : undefined });

    } catch (error) {
        logger.error(error);
        next(error);
    }
}