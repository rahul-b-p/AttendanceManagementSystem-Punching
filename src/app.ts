import { config } from 'dotenv';
import express from 'express';
import { logger } from './utils/logger';

config();

const app = express();





const port = process.env.PORT || 3000;


app.listen(port,()=>{
    logger.info(`app running successfully at http://localhost:${port}`);
})