import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { CustomError } from "../errors";
import { ZodError } from "zod";



export const ErrorHandler: ErrorRequestHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {

    if (err instanceof CustomError) {
        res.status(err.statusCode).json(err.serialize());
        return;
    }
    
    else if (err instanceof ZodError) {
        res.status(422).json({ message: 'Validation failed', errors: err });
        return;
    }
    
    else if(err instanceof SyntaxError){
        res.status(400).json({
            error: err.name,
            message: 'Something bad has happend while requesting'
        });
    }

    else{
        res.status(500).json({
            success:false,
            message:"Internal Server Error"
        })
    }
}