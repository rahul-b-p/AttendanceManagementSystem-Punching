import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { CustomError } from "../errors";
import { ZodError } from "zod";
import { logger } from "../utils";


/**
 * Middleware function to handle Errors
*/
export const ErrorHandler: ErrorRequestHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {

    if (err instanceof CustomError) {
        logger.warn('Ooops, Request Failed....!');
        res.status(err.statusCode).json(err.serialize());
        return;
    }

    else if (err instanceof ZodError) {
        res.status(422).json({ message: 'Validation failed', errors: err });
        return;
    }

    else if (err instanceof SyntaxError) {
        res.status(400).json({
            error: err.name,
            message: 'Something bad has happend while requesting'
        });
    }

    else {
        logger.error(`Application Error: ${err.message}`);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}