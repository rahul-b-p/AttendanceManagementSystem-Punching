import { Router } from "express";
import { validateReqBody } from "../middlewares";
import { userAuthSchema } from "../schemas";
import { authController } from "../controllers";
import { refreshTokenAuth } from "../middlewares/auth.middleware";



export const router = Router();


router.post('/login', validateReqBody(userAuthSchema), authController.login);

router.post('/refresh', refreshTokenAuth, authController.refresh);