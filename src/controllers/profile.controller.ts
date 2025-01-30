import { NextFunction, Response } from "express";
import { logFunctionInfo, logger, sendCustomResponse } from "../utils";
import { FunctionStatus, Roles } from "../enums";
import { customRequestWithPayload, IUser } from "../interfaces";
import { AuthenticationError, BadRequestError, ConflictError, ForbiddenError, InternalServerError } from "../errors";
import { errorMessage, responseMessage } from "../constants";
import { findUserById, getUserData, sendUserUpdationNotification, updateUserById, validateEmailUniqueness } from "../services";
import { UserUpdateArgs, UserUpdateBody } from "../types";
import { checkEmailValidity, validateRole } from "../validators";




/**
 * Controller Function to get all data of logined user
 */
export const getAllData = async (req: customRequestWithPayload, res: Response, next: NextFunction) => {
    const functionName = getAllData.name;
    try {
        const id = req.payload?.id;
        if (!id) throw new InternalServerError(errorMessage.NO_USER_ID_IN_PAYLOAD);

        const userData = await getUserData(id);
        if (!userData) throw new AuthenticationError();

        res.status(200).json(await sendCustomResponse(responseMessage.PROFILE_FETCHED, userData))
    } catch (error) {
        logFunctionInfo(functionName, FunctionStatus.fail);
        next(error);
    }
}


/**
 * Controller function to allow a logged-in user to update their own account details.
 * If the user updates their email,
 * the account will need re-verification to confirm the new email address.
 */
export const updateProfile = async (req: customRequestWithPayload<{}, any, UserUpdateBody>, res: Response, next: NextFunction) => {
    const functionName = 'updateProfile';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { role, email } = req.body;
        const id = req.payload?.id as string;
        const existingUser = await findUserById(id) as IUser;



        if (role) {
            const isValidRole = await validateRole(role);
            if (!isValidRole) throw new BadRequestError(errorMessage.INVALID_ROLE);

            if (existingUser.role !== Roles.admin) throw new ForbiddenError(errorMessage.INSUFFICIENT_PRIVILEGES);
        }


        let userUpdateArgs;
        let emailAdress;
        let message;
        if (email) {
            const isValidEmail = await checkEmailValidity(email);
            if (!isValidEmail) throw new BadRequestError("Invalid Email Id");

            if (email == existingUser.email) throw new BadRequestError(errorMessage.EMAIL_ALREADY_IN_USE);

            const isUniqueEmail = await validateEmailUniqueness(email);
            if (!isUniqueEmail) throw new ConflictError(errorMessage.USER_ALREADY_EXISTS);
            userUpdateArgs = { $set: { ...req.body, verified: false }, $unset: { refreshToken: 1 } } as UserUpdateArgs;
            emailAdress = [email, existingUser.email] as string[];
            message = `${responseMessage.PROFILE_UPDATED}, ${responseMessage.EMAIL_VERIFICATION_REQUIRED}` as string;
        }
        else {
            userUpdateArgs = { $set: req.body } as UserUpdateArgs;
            emailAdress = [] as string[];
            message = responseMessage.PROFILE_UPDATED as string;
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
        logFunctionInfo(functionName, FunctionStatus.fail);
        next(error);
    }
}