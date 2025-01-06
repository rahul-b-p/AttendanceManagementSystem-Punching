import winston from "winston";



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