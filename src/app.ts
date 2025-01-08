import express from 'express';
import { createDefaultAdmin, logger } from './utils';
import './config/envConfig';
import { connectDB } from './database';


const app = express();

connectDB();
createDefaultAdmin();



const port = process.env.PORT || 3000;


app.listen(port, () => {
    logger.info(`app running successfully at http://localhost:${port}`);
})