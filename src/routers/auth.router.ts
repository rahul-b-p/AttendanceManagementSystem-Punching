import { Router } from "express";
import { accessTokenAuth, validateReqBody } from "../middlewares";
import { forgotPasswordSchema, userAuthSchema, userOtpValidationSchema } from "../schemas";
import { authController } from "../controllers";
import { refreshTokenAuth } from "../middlewares";



export const router = Router();

// API to login
router.post('/login', validateReqBody(userAuthSchema), authController.login);

// API to refresh tokens
router.post('/refresh', refreshTokenAuth, authController.refresh);

// API to logout
router.post('/logout', accessTokenAuth, authController.logout);

// API to validate unverified accounts on their first login by otp validation
router.post('/verify-first-login', validateReqBody(userOtpValidationSchema), authController.firstLoginOtpValidation);

// API to request otp for password reset 
router.post('/forgot-password', validateReqBody(forgotPasswordSchema), authController.forgotPassword);

// API to reset password by otp validation
router.post('/reset-password', validateReqBody(userOtpValidationSchema), authController.resetPassword);