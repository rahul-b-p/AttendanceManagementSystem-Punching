import { Router } from "express";
import { validateReqBody, validateReqQuery } from "../middlewares";
import { createOfficeSchema, officeFilterQuerySchema } from "../schemas";
import { officeController } from "../controllers";



export const router = Router();

router.post('/', validateReqBody(createOfficeSchema), officeController.createOffice);

router.get('/', validateReqQuery(officeFilterQuerySchema), officeController.readOffices);