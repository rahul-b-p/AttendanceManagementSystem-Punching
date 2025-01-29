import { NextFunction, Response } from "express";
import { customRequestWithPayload } from "../interfaces";
import { logFunctionInfo, pagenate, sendCustomResponse } from "../utils";
import { CustomRolesFilter, InsertRoleArgs, UpdateRoleArgs } from "../types";
import { deleteCustomRoleById, fetchCustomRoles, findCustomRole, insertRole, updateCustomRoleById } from "../services";
import { BadRequestError, ConflictError, NotFoundError } from "../errors";
import { isValidObjectId } from "../validators";
import { FunctionStatus } from "../enums";




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
        if (existingRole) throw new ConflictError("Requested custom role Already exists");

        const newCustomRole = await insertRole(req.body);

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(201).json(await sendCustomResponse("new customized role created", newCustomRole))
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

        const responseMessage = fetchResult ? 'User Data Fetched Successfully' : 'No Users found to show';
        let PageNationFeilds;
        if (fetchResult) {
            const { data, ...pageInfo } = fetchResult
            PageNationFeilds = pagenate(pageInfo, req.originalUrl);
        }

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json({
            success: true, responseMessage, ...fetchResult, ...PageNationFeilds
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
        if (!isValidId) throw new BadRequestError("Invalid Id Provided");


        const { role } = req.body;
        if (role) {
            const existingRole = await findCustomRole(role);
            if (existingRole) throw new ConflictError('Cant Update role, its already exists!');
        }

        const updatetedRole = await updateCustomRoleById(id, req.body);
        if (!updatetedRole) throw new NotFoundError('Requested role not found for an updation');

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse('customRole Updated SuccessFully', updatetedRole));
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
        if (!isValidId) throw new BadRequestError("Invalid Id Provided");

        const isDeleted = await deleteCustomRoleById(id);
        if (!isDeleted) throw new NotFoundError("Requested Custom Role Not Found");

        logFunctionInfo(functionName, FunctionStatus.success);
        res.status(200).json(await sendCustomResponse("Customized role requested successfully"));
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        next(error);
    }
}