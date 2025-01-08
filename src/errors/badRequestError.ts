import CustomError from "./customError";

class BadRequestError extends CustomError {
    constructor(message: string = 'inValid Request') {
        super(message, 400);
    }
}

export default BadRequestError;