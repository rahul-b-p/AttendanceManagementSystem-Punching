import { NextFunction, Response } from "express";
import { BadRequestError, ConflictError, ForbiddenError, InternalServerError } from "../errors";
import { logger, sendCustomResponse } from "../utils"
import { customRequestWithPayload, IUser } from "../interfaces";
import { UserInsertArgs } from "../types";
import { checkEmailValidity } from "../validators";
import { findUserById, insertUser, validateEmailUniqueness } from "../services";
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