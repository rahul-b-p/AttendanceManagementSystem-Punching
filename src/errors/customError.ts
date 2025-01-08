

class CustomError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }

    serialize() {
        return {
            success:false,
            error: this.message,
            statusCode: this.statusCode,
        };
    }
}

export default CustomError;
