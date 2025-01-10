import { Router } from "express";
import { roleAuth, validateReqBody, validateReqQuery } from "../middlewares";
import { Roles } from "../enums";
import { createUserSchema, updateUserSchema, userFilterQuerySchema } from "../schemas";
import { userController } from "../controllers";



export const router = Router();

router.post('/', roleAuth(Roles.admin, Roles.manager), validateReqBody(createUserSchema), userController.createUser);

router.get('/', roleAuth(Roles.admin, Roles.manager), validateReqQuery(userFilterQuerySchema), userController.readUsers);

router.put('/:id', roleAuth(Roles.admin, Roles.manager), validateReqBody(updateUserSchema), userController.updateUserByAdmin);

router.delete('/:id', roleAuth(Roles.admin, Roles.manager), userController.deleteUserByAdmin);