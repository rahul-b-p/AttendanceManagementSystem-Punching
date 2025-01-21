import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import { BadRequestError } from "../errors";
import { InternalServerError } from "../errors";




export const validateReqBody = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
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

export const validateReqQuery= (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
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


