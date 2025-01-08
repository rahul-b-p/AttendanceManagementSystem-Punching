import CustomError from "./customError";

class authenticationError extends CustomError {
    constructor(message: string = 'UnAuthorized!') {
        super(message, 401);
    }
}

export default authenticationError;