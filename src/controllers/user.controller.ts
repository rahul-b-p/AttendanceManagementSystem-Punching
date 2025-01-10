import { NextFunction, Response } from "express";
import { BadRequestError, ConflictError, ForbiddenError, InternalServerError, NotFoundError } from "../errors";
import { logger, sendCustomResponse } from "../utils"
import { customRequestWithPayload, IUser } from "../interfaces";
import { UserInsertArgs, UserUpdateArgs, UserUpdateBody } from "../types";
import { checkEmailValidity, isValidObjectId } from "../validators";
import { findUserById, insertUser, updateUserById, validateEmailUniqueness } from "../services";
import { Roles } from "../enums";





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