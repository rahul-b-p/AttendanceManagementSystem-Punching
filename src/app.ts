import express from 'express';
import { createDefaultAdmin, logger } from './utils';
import './config/envConfig';
import { connectDB } from './database';
import { accessTokenAuth, ErrorHandler, roleAuth } from './middlewares';
import { attendanceRouter, authRouter, officeRouter, profileRouter, roleRouter, userRouter } from './routers';
import { Roles } from './enums';




const app = express();
const port = process.env.PORT || 3000;

const initializeApp = async () => {
    try {
        // First connect to database
        await connectDB();

        // Then create default admin
        await createDefaultAdmin();

        // Setup json body parser middleware
        app.use(express.json());

        // Setup routes
        app.use('/auth', authRouter);
        app.use('/me', accessTokenAuth, profileRouter)
        app.use('/user', accessTokenAuth, userRouter);
        app.use('/role', accessTokenAuth, roleAuth(Roles.admin), roleRouter);
        app.use('/office', accessTokenAuth, officeRouter);
        app.use('/attendance', accessTokenAuth, attendanceRouter); // Fixed typo in 'attendance'

        // Express error handler 
        app.use(ErrorHandler);

        // Start server only after all initialization is complete
        app.listen(port, () => {
            logger.info(`Server running successfully at http://localhost:${port}`);
        });
    } catch (error) {
        logger.error('Failed to initialize application:', error);
        process.exit(1);
    }
}

// Start the application
initializeApp();

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Rejection:', error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});