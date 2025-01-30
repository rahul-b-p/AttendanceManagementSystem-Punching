import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { CustomError, InternalServerError } from "../errors";
import { ZodError } from "zod";
import { logger } from "../utils";
import { errorMessage } from "../constants";


/**
 * Middleware function to handle Errors
*/
export const ErrorHandler: ErrorRequestHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {

    if (err instanceof CustomError) {
        if (err instanceof InternalServerError) {
            logger.error(`Application Error: ${err.message}`);
            res.status(err.statusCode).json(err.serialize)
        }
        logger.warn(errorMessage.REQUEST_FAILED);
        res.status(err.statusCode).json(err.serialize());
        return;
    }

    else if (err instanceof ZodError) {
        res.status(422).json({ message: errorMessage.VALIDATION_FAILED, errors: err });
        return;
    }

    else if (err instanceof SyntaxError) {
        res.status(400).json({
            error: err.name,
            message: errorMessage.CLIENT_SIDE_REQUEST_FAILED
        });
    }

    else {
        logger.error(`Application Error: ${err.message}`);
        res.status(500).json({
            success: false,
            message: errorMessage.SERVER_ISSUE
        })
    }
}