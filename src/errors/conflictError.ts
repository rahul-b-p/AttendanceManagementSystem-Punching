import CustomError from './customError';

class ConflictError extends CustomError {
    constructor(message: string = 'Conflict error occurred') {
        super(message, 409);
    }
}

export default ConflictError;
