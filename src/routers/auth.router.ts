import { Router } from "express";
import { accessTokenAuth, validateReqBody } from "../middlewares";
import { forgotPasswordSchema, resetPasswordSchema, userAuthSchema, userOtpValidationSchema } from "../schemas";
import { authController } from "../controllers";
import { refreshTokenAuth } from "../middlewares";



export const router = Router();


router.post('/login', validateReqBody(userAuthSchema), authController.login);

router.post('/refresh', refreshTokenAuth, authController.refresh);

router.post('/logout', accessTokenAuth, authController.logout);

router.post('/verify-first-login', validateReqBody(userOtpValidationSchema), authController.firstLoginOtpValidation);

router.post('/forgot-password', validateReqBody(forgotPasswordSchema), authController.forgotPassword);

router.post('/reset-password',validateReqBody(resetPasswordSchema),authController.resetPassword);