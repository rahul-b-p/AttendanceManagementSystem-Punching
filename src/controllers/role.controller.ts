import { NextFunction, Response } from "express";
import { customRequestWithPayload } from "../interfaces";
import { logFunctionInfo, pagenate, sendCustomResponse } from "../utils";
import { CustomRolesFilter, InsertRoleArgs, UpdateRoleArgs } from "../types";
import { deleteCustomRoleById, fetchCustomRoles, findCustomRole, findCustomRoleById, insertRole, updateCustomRoleById } from "../services";
import { BadRequestError, ConflictError, NotFoundError } from "../errors";
import { isValidObjectId } from "../validators";
import { FunctionStatus } from "../enums";
import { errorMessage, responseMessage, } from "../constants";




/**
 * Controller function to create a custom role
 * @protected - only admin can access this feature
 */
export const createCustomRole = async (req: customRequestWithPayload<{}, any, InsertRoleArgs>, res: Response, next: NextFunction) => {
    const functionName = 'createCustomRole';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { role } = req.body;
        const existingRole = await findCustomRole(role);
        if (existingRole) throw new ConflictError(errorMessage.CUSTOM_ROLE_ALREADY_EXISTS);

        const newCustomRole = await insertRole(req.body);

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(201).json(await sendCustomResponse(responseMessage.ROLE_CREATED, newCustomRole))
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}


/**
 * Controller function to read all custom roles
 * @protected - only admin can access this feature
 */
export const readAllCustomRoles = async (req: customRequestWithPayload<{}, any, any, CustomRolesFilter>, res: Response, next: NextFunction) => {
    const functionName = 'readAllCustomRoles';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { pageNo, pageLimit } = req.query;
        const fetchResult = await fetchCustomRoles(Number(pageNo), Number(pageLimit));

        const message = fetchResult ? responseMessage.ROLE_DATA_FETCHED : errorMessage.ROLE_DATA_NOT_FOUND;
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
 * Controller function to update a custom role
 * @param id -role id
 * @protected - only admin can access this feature
 */
export const updateCustomRole = async (req: customRequestWithPayload<{ id: string }, any, UpdateRoleArgs>, res: Response, next: NextFunction) => {
    const functionName = 'updateCustomRole';
    logFunctionInfo(functionName, FunctionStatus.start);
    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) throw new BadRequestError(errorMessage.INVALID_ID);

        const { role } = req.body;
        if (role) {
            const existingRole = await findCustomRole(role);
            if (existingRole) throw new ConflictError(errorMessage.ROLE_ALREADY_EXISTS);
        }

        const updatetedRole = await updateCustomRoleById(id, req.body);
        if (!updatetedRole) throw new NotFoundError(errorMessage.ROLE_NOT_FOUND);

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse(responseMessage.ROLE_UPDATED, updatetedRole));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}


/**
 * Controller function to delete a custom role
 * @param id -role id
 * @protected - only admin can access this feature
 */
export const deleteCustomRole = async (req: customRequestWithPayload<{ id: string }>, res: Response, next: NextFunction) => {
    const functionName = 'deleteCustomRole';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) throw new BadRequestError(errorMessage.INVALID_ID);

        const isDeleted = await deleteCustomRoleById(id);
        if (!isDeleted) throw new NotFoundError(errorMessage.ROLE_NOT_FOUND);

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse(responseMessage.ROLE_DELETED));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}

/**
 * Controller Function to read a custom role using its un ique id
 * @param id - unique id of a custom role
 * @protected - only admin can access
 */
export const readCustomRoleById = async (req: customRequestWithPayload<{ id: string }>, res: Response, next: NextFunction) => {
    const functionName = readCustomRoleById.name;
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const { id } = req.params;
        const isValidId = isValidObjectId(id);
        if (!isValidId) throw new BadRequestError(errorMessage.INVALID_ID);


        const existingRole = await findCustomRoleById(id);
        if (!existingRole) throw new NotFoundError(errorMessage.ROLE_NOT_FOUND);

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse(responseMessage.ROLE_DATA_FETCHED, existingRole));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail);
        next(error);
    }
}