import { MONGODB_URI } from "../config";
import { logger } from "../utils/logger"
import mongoose from 'mongoose';



export const connectDB = async () => {
    try {
        

        const mongoConnect = await mongoose.connect(MONGODB_URI);
        logger.info(`Mongo DB Connected: ${mongoConnect.connection.host} `);

        mongoose.connection.on('disconnected', () => {
            logger.info('MongoDB disconnected');
        });

        mongoose.connection.on('error', (err) => {
            logger.info('MongoDB connection error:', err);
        });

    } catch (error: any) {
        logger.error(`DB Connection Failed: ${error.message}`);
        process.exit(1);
    }
}