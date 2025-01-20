import { Router } from "express";
import { validateReqBody, validateReqQuery } from "../middlewares";
import { createOfficeSchema, officeFilterQuerySchema, updateOfficeSchema } from "../schemas";
import { officeController } from "../controllers";



export const router = Router();

router.post('/', validateReqBody(createOfficeSchema), officeController.createOffice);

router.get('/', validateReqQuery(officeFilterQuerySchema), officeController.readOffices);

router.put('/:id', validateReqBody(updateOfficeSchema), officeController.updateOffice);