import winston from "winston";
import { FunctionStatus } from "../enums";


// Winston logger configuration
export const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp }) => {
            const formattedMessage =
                typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
            return `${timestamp} [${level}]: ${formattedMessage}`;
        })
    ),
    transports: [new winston.transports.Console()],
});


/**
 * logs Function Information
*/
export const logFunctionInfo = (functionName: string, functionStatus: FunctionStatus, details?: string): void => {
    const logData = `Function: ${functionName}, Status: ${functionStatus} ${details ? ', Details: ' + details : ''}`;
    if (functionStatus == FunctionStatus.fail) {
        logger.error(logData)
    }
    else {
        logger.info(logData);
    }
}