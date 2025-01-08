import express from 'express';
import { logger } from './utils/logger';
import './config/envConfig';
import { connectDB } from './database';


const app = express();

connectDB();




const port = process.env.PORT || 3000;


app.listen(port,()=>{
    logger.info(`app running successfully at http://localhost:${port}`);
})