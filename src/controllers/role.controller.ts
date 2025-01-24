import { NextFunction, Response } from "express";
import { customRequestWithPayload } from "../interfaces";
import { logger, pagenate, sendCustomResponse } from "../utils";
import { CustomRolesFilter, InsertRoleArgs, UpdateRoleArgs } from "../types";
import { deleteCustomRoleById, fetchCustomRoles, findCustomRole, insertRole, updateCustomRoleById } from "../services";
import { BadRequestError, ConflictError, NotFoundError } from "../errors";
import { isValidObjectId } from "../validators";




/**
 * Controller function to create a custom role
 * @protected - only admin can access this feature
 */
export const createCustomRole = async (req: customRequestWithPayload<{}, any, InsertRoleArgs>, res: Response, next: NextFunction) => {
    try {
        const { role } = req.body;
        const existingRole = await findCustomRole(role);
        if (existingRole) throw new ConflictError("Requested custom role Already exists");

        const newCustomRole = await insertRole(req.body);

        res.status(201).json(await sendCustomResponse("new customized role created", newCustomRole))
    } catch (error: any) {
        logger.error(error);
        next(error);
    }
}


/**
 * Controller function to read all custom roles
 * @protected - only admin can access this feature
 */
export const readAllCustomRoles = async (req: customRequestWithPayload<{}, any, any, CustomRolesFilter>, res: Response, next: NextFunction) => {
    try {
        const { pageNo, pageLimit } = req.query;
        const fetchResult = await fetchCustomRoles(Number(pageNo), Number(pageLimit));

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
 * Controller function to update a custom role
 * @param id -role id
 * @protected - only admin can access this feature
 */
export const updateCustomRole = async (req: customRequestWithPayload<{ id: string }, any, UpdateRoleArgs>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) throw new BadRequestError("Invalid Id Provided");


        const { role } = req.body;
        if (role) {
            const existingRole = await findCustomRole(role);
            if (existingRole) throw new ConflictError('Cant Update role, its already exists!');
        }

        const updatetedRole = await updateCustomRoleById(id, req.body);
        if (!updatetedRole) throw new NotFoundError('Requested role not found for an updation');

        res.status(200).json(await sendCustomResponse('customRole Updated SuccessFully', updatetedRole));
    } catch (error) {
        logger.error(error);
        next(error);
    }
}


/**
 * Controller function to delete a custom role
 * @param id -role id
 * @protected - only admin can access this feature
 */
export const deleteCustomRole = async (req: customRequestWithPayload<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) throw new BadRequestError("Invalid Id Provided");

        const isDeleted = await deleteCustomRoleById(id);
        if (!isDeleted) throw new NotFoundError("Requested Custom Role Not Found");

        res.status(200).json(await sendCustomResponse("Customized role requested successfully"));

    } catch (error) {
        logger.error(error);
        next(error);
    }
}