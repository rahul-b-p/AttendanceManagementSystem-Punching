import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { CustomError } from "../errors";
import { ZodError } from "zod";



export const ErrorHandler: ErrorRequestHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Content-Type', 'application/json');

    if (err instanceof CustomError) {
        res.status(err.statusCode).json(err.serialize());
    }
    
    if (err instanceof ZodError) {
        res.status(422).json({ message: 'Validation failed', errors: err });
    }
    
    else {
        res.status(400).json({
            message: 'Something bad has happend while requesting',
            error: err.message
        });
    }
}