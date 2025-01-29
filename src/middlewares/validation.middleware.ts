import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import { BadRequestError } from "../errors";
import { InternalServerError } from "../errors";
import { logFunctionInfo } from "../utils";
import { FunctionStatus } from "../enums";



/**
 * Middleware function to Validate Request body
*/
export const validateReqBody = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        logFunctionInfo("validateReqBody", FunctionStatus.start);
        
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                error.errors.map((e) => {
                    return next(new BadRequestError(`Bad Request, ${e.message}`));
                })
            }
            else next(new InternalServerError('Validation failed'));
        }
    };
}


/**
 * Middleware function to Validate Request query
*/
export const validateReqQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        logFunctionInfo("validateReqQuery", FunctionStatus.start);

        try {
            req.query = schema.parse(req.query);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                error.errors.map((e) => {
                    return next(new BadRequestError(`Bad Request, Invalid Query:${e.message}`));
                })
            }
            else next(new InternalServerError('Validation failed'));
        }
    };
}


