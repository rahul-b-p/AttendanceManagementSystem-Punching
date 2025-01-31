import { Router } from "express";
import { validateReqBody, validateReqQuery } from "../middlewares";
import { createCustomRoleSchema, roleFilterSchema, updateCustomRoleSchema } from "../schemas";
import { roleController } from "../controllers";




export const router = Router();

// API to cretae a custom role -- only for admin
router.post('/', validateReqBody(createCustomRoleSchema), roleController.createCustomRole);

// API to read all custom roles -- only for admin
router.get('/', validateReqQuery(roleFilterSchema), roleController.readAllCustomRoles);

// API to update an existing xustom role -- only for admin
router.put('/:id', validateReqBody(updateCustomRoleSchema), roleController.updateCustomRole);

// API to delete an existing custom role -- only fo admin
router.delete('/:id', roleController.deleteCustomRole);

// API to read custom role using its unique id --only for admin
router.get('/:id', roleController.readCustomRoleById)