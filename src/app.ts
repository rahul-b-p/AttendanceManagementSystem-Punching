import express from 'express';
import { createDefaultAdmin, logger } from './utils';
import './config/envConfig';
import { connectDB } from './database';
import { accessTokenAuth, ErrorHandler, roleAuth } from './middlewares';
import { authRouter, roleRouter, userRouter } from './routers';
import { Roles } from './enums';



const app = express();

connectDB();
createDefaultAdmin();

app.use(express.json());

app.use('/auth', authRouter);
app.use('/user', accessTokenAuth, userRouter);
app.use('/role', accessTokenAuth, roleAuth(Roles.admin), roleRouter);
app.use(ErrorHandler);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    logger.info(`app running successfully at http://localhost:${port}`);
});