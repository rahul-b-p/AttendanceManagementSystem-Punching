import { Router } from "express";
import { roleAuth, validateReqBody } from "../middlewares";
import { Roles } from "../enums";
import { createUserSchema, updateUserSchema } from "../schemas";
import { userController } from "../controllers";



export const router = Router();

router.post('/', roleAuth(Roles.admin, Roles.manager), validateReqBody(createUserSchema), userController.createUser);

router.put('/:id', roleAuth(Roles.admin, Roles.manager), validateReqBody(updateUserSchema), userController.updateUserByAdmin);