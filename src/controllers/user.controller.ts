import { NextFunction, Response } from "express";
import { BadRequestError, ConflictError, ForbiddenError, InternalServerError, NotFoundError } from "../errors";
import { getUserSortArgs, logger, pagenate, sendCustomResponse } from "../utils"
import { customRequestWithPayload, IUser } from "../interfaces";
import { UserFilterQuery, UserInsertArgs, userQuery, UserSearchQuery, UserUpdateArgs, UserUpdateBody } from "../types";
import { checkEmailValidity, isValidObjectId } from "../validators";
import { deleteUserById, findUserById, fetchUsers, insertUser, updateUserById, validateEmailUniqueness, getUserData, sendUserCreationNotification, sendUserUpdationNotification } from "../services";
import { Roles, UserSortArgs } from "../enums";





export const createUser = async (req: customRequestWithPayload<{}, any, UserInsertArgs>, res: Response, next: NextFunction) => {
    try {
        const { email, role } = req.body;

        const ownerId = req.payload?.id as string;
        const owner = await findUserById(ownerId) as IUser;
        if (role == Roles.admin && owner.role !== Roles.admin) return next(new ForbiddenError('Forbidden: Insufficient role privileges'));

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

export const readUsers = async (req: customRequestWithPayload<{}, any, any, UserFilterQuery>, res: Response, next: NextFunction) => {
    try {
        const ownerId = req.payload?.id as string;
        const owner = await findUserById(ownerId) as IUser;

        const { role, pageNo, pageLimit, sortKey } = req.query;
        if (owner.role !== Roles.admin && role == Roles.admin) throw new ForbiddenError("Insufficient role privilliages to take an action");

        const query: userQuery = role ? { role } : {};
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

export const updateUserByAdmin = async (req: customRequestWithPayload<{ id: string }, any, UserUpdateBody>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) return next(new BadRequestError("Invalid User Id"));

        const existingUser = await findUserById(id);
        if (!existingUser) return next(new NotFoundError("Requested user not found!"));

        const ownerId = req.payload?.id as string;
        const owner = await findUserById(ownerId) as IUser;
        if (existingUser.role == Roles.admin && owner.role !== Roles.admin) return next(new ForbiddenError('Forbidden: Insufficient role privileges'));

        const { email } = req.body;
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

export const deleteUserByAdmin = async (req: customRequestWithPayload<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) return next(new BadRequestError("Invalid User Id"));

        const existingUser = await findUserById(id);
        if (!existingUser) return next(new NotFoundError("Requested user not found!"));

        const ownerId = req.payload?.id as string;
        const owner = await findUserById(ownerId) as IUser;
        if (existingUser.role == Roles.admin && owner.role !== Roles.admin) return next(new ForbiddenError('Forbidden: Insufficient role privileges'));

        await deleteUserById(id);
        res.status(200).json(await sendCustomResponse("User Deleted Successfully"));
    } catch (error) {
        logger.info(error);
        next(error);
    }
}

export const searchAndFilterUser = async (req: customRequestWithPayload<{}, any, any, UserFilterQuery & UserSearchQuery>, res: Response, next: NextFunction) => {
    try {
        const ownerId = req.payload?.id as string;
        const owner = await findUserById(ownerId) as IUser;

        const { role, pageNo, pageLimit, sortKey, username } = req.query;
        if (owner.role !== Roles.admin && role == Roles.admin) throw new ForbiddenError("Insufficient role privilliages to take an action");

        const query: userQuery = role ? { role } : {};
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

export const readUserDataByAdmin = async (req: customRequestWithPayload<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const ownerId = req.payload?.id as string;
        const owner = await findUserById(ownerId) as IUser;

        const { id } = req.params;
        const existingUser = await getUserData(id);

        if (!existingUser) throw new NotFoundError('User Not Found!')

        if (existingUser.role == Roles.admin && owner.role !== Roles.admin) throw new ForbiddenError("Insufficient role privilliages to take an action");

        res.status(200).json(await sendCustomResponse("User Details Fetched", existingUser));
    } catch (error) {
        logger.error(error);
        next(error);
    }
}