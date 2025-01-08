import { Router } from "express";
import { validateReqBody } from "../middlewares";
import { userAuthSchema } from "../schemas";
import { authController } from "../controllers";



export const router = Router();


router.post('/login', validateReqBody(userAuthSchema), authController.login);