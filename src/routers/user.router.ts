import { Router } from "express";
import { roleAuth, validateReqBody, validateReqQuery } from "../middlewares";
import { Roles } from "../enums";
import { createUserSchema, updateUserSchema, userFilterQuerySchema, userSearchFilterQuerySchema } from "../schemas";
import { userController } from "../controllers";



export const router = Router();

// API to create a new user -- role based access
router.post('/', roleAuth(Roles.admin, Roles.manager), validateReqBody(createUserSchema), userController.createUser);

// API to read all Users by filtering,pagenation and sorting -- role based access
router.get('/all', roleAuth(Roles.admin, Roles.manager), validateReqQuery(userFilterQuerySchema), userController.readUsers);

// API to update an existing user -- role based access 
router.put('/:id', roleAuth(Roles.admin, Roles.manager), validateReqBody(updateUserSchema), userController.updateUserByAdmin);

// API to delete an existing user -- role based access
router.delete('/:id', roleAuth(Roles.admin, Roles.manager), userController.deleteUserByAdmin);

// API to filter and search users -- role based access
router.get('/filter', roleAuth(Roles.admin, Roles.manager), validateReqQuery(userSearchFilterQuerySchema), userController.searchAndFilterUser);

// API to read complete details of a specific user -- role based access
router.get('/:id', roleAuth(Roles.admin, Roles.manager), userController.readUserDataByAdmin);
