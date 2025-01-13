import { NextFunction, Response } from "express";
import { BadRequestError, ConflictError, ForbiddenError, InternalServerError, NotFoundError } from "../errors";
import { getUserSortArgs, logger, sendCustomResponse } from "../utils"
import { customRequestWithPayload, IUser } from "../interfaces";
import { UserFilterQuery, UserInsertArgs, userQuery, UserSearchQuery, UserUpdateArgs, UserUpdateBody } from "../types";
import { checkEmailValidity, isValidObjectId } from "../validators";
import { deleteUserById, findUserById, fetchUsers, insertUser, updateUserById, validateEmailUniqueness, getUserData } from "../services";
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

        const { role, page, sortKey } = req.query;
        if (owner.role !== Roles.admin && role == Roles.admin) throw new ForbiddenError("Insufficient role privilliages to take an action");

        const query: userQuery = role ? { role } : {};
        const sort: UserSortArgs = getUserSortArgs(sortKey);


        const users = await fetchUsers(Number(page), query, sort);
        const message = users ? 'User Data Fetched Successfully' : 'No Users found to show';
        res.status(200).json(await sendCustomResponse(message, users));
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
        if (email) {
            const isValidEmail = await checkEmailValidity(email);
            if (!isValidEmail) return next(new BadRequestError("Invalid Email Id"));

            const isUniqueEmail = await validateEmailUniqueness(email);
            if (!isUniqueEmail) return next(new ConflictError("User already exists!"));
        }

        const userUpdateArgs: UserUpdateArgs = { $set: req.body };
        const updatedUser = await updateUserById(id, userUpdateArgs);

        res.status(200).json(await sendCustomResponse("User Updated succesfully", updatedUser));

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

        const { role, page, sortKey, username } = req.query;
        if (owner.role !== Roles.admin && role == Roles.admin) throw new ForbiddenError("Insufficient role privilliages to take an action");

        const query: userQuery = role ? { role } : {};
        const sort: UserSortArgs = getUserSortArgs(sortKey);

        const users = await fetchUsers(Number(page), query, sort, username);

        const responseMessage = users ? 'User Data Fetched Successfully' : 'No Users found to show';
        res.status(200).json(await sendCustomResponse(responseMessage, users));
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