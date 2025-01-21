import CustomError from "./customError";

class InternalServerError extends CustomError {
    constructor(message: string = 'Something goes wrong on the server') {
        super(message, 500);
    }
}

export default InternalServerError;