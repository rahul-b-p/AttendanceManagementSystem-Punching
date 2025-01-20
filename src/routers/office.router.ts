import { Router } from "express";
import { roleAuth, validateReqBody, validateReqQuery } from "../middlewares";
import { createOfficeSchema, officeFilterQuerySchema, officeUserActionSchema, updateOfficeSchema } from "../schemas";
import { officeController } from "../controllers";
import { Roles } from "../enums";



export const router = Router();

router.post('/', roleAuth(Roles.admin), validateReqBody(createOfficeSchema), officeController.createOffice);

router.get('/', roleAuth(Roles.admin), validateReqQuery(officeFilterQuerySchema), officeController.readOffices);

router.put('/:id', roleAuth(Roles.admin), validateReqBody(updateOfficeSchema), officeController.updateOffice);

router.delete('/:id', roleAuth(Roles.admin), officeController.deleteOffice);

router.put('/assign/:officeId', roleAuth(Roles.admin, Roles.manager), validateReqBody(officeUserActionSchema), officeController.assignToOffice);

router.put('/remove/:officeId', roleAuth(Roles.admin, Roles.manager), validateReqBody(officeUserActionSchema), officeController.removeFromOffice);