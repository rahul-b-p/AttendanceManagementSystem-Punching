import { Router } from "express";
import { validateReqBody } from "../middlewares";
import { createOfficeSchema } from "../schemas";
import { officeController } from "../controllers";



export const router = Router();

router.post('/', validateReqBody(createOfficeSchema), officeController.createOffice);