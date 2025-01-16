import { Router } from "express";
import { validateReqBody, validateReqQuery } from "../middlewares";
import { createCustomRoleSchema, roleFilterSchema, updateCustomRoleSchema } from "../schemas";
import { roleController } from "../controllers";




export const router = Router();


router.post('/', validateReqBody(createCustomRoleSchema), roleController.createCustomRole);

router.get('/', validateReqQuery(roleFilterSchema), roleController.readAllCustomRoles);

router.put('/:id', validateReqBody(updateCustomRoleSchema), roleController.updateCustomRole);

router.delete('/:id', roleController.deleteCustomRole);