import CustomError from "./customError";

class ForbiddenError extends CustomError {
    constructor(message: string = 'Access to this resource is forbidden') {
        super(message, 403);
    }
}

export default ForbiddenError;