import express from 'express';
import { createDefaultAdmin, logger } from './utils';
import './config/envConfig';
import { connectDB } from './database';
import { ErrorHandler } from './middlewares';
import { authRouter } from './routers';


const app = express();

connectDB();
createDefaultAdmin();

app.use(express.json());

app.use('/auth', authRouter);

app.use(ErrorHandler);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    logger.info(`app running successfully at http://localhost:${port}`);
});