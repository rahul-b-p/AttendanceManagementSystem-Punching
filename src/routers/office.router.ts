import { Router } from "express";
import { roleAuth, validateReqBody, validateReqQuery } from "../middlewares";
import { createOfficeSchema, officeFilterQuerySchema, updateOfficeSchema } from "../schemas";
import { officeController } from "../controllers";
import { Roles } from "../enums";



export const router = Router();

// API to create a new office -- only for admin
router.post('/', roleAuth(Roles.admin), validateReqBody(createOfficeSchema), officeController.createOffice);

// API to read all office details -- only for admin
router.get('/', roleAuth(Roles.admin), validateReqQuery(officeFilterQuerySchema), officeController.readOffices);

// API to update an existing office -- only for admin
router.put('/:id', roleAuth(Roles.admin), validateReqBody(updateOfficeSchema), officeController.updateOffice);

// API to delete(soft deletion) an existing office -- only for admin
router.delete('/:id', roleAuth(Roles.admin), officeController.deleteOffice);

// API to assign employee or manager to an office --role based access
router.put('/assign/:officeId/:userId/:role', roleAuth(Roles.admin, Roles.manager), officeController.assignToOffice);

// API to remove employee or manager from an office --role based access
router.put('/remove/:officeId/:userId/:role', roleAuth(Roles.admin, Roles.manager), officeController.removeFromOffice);

// API to view all trash office data -- only for admin
router.get('/trash', roleAuth(Roles.admin), validateReqQuery(officeFilterQuerySchema), officeController.fetchOfficeTrash);

// API to delete a office data from trash -- only for admin
router.delete('/trash/:id', roleAuth(Roles.admin), officeController.deleteOfficeTrash);

// API to find Office Data with id
router.get('/:id', roleAuth(Roles.admin), officeController.readOfficeById);