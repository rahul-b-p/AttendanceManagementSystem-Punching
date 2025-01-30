import { Router } from "express";
import { profileController } from "../controllers";
import { validateReqBody } from "../middlewares";
import { updateUserSchema } from "../schemas";




export const router = Router();

// API for a user to fetch all the profile related data
router.get('/', profileController.getAllData)


// API for a user to update their own account details. 
router.put('/', validateReqBody(updateUserSchema), profileController.updateProfile);
