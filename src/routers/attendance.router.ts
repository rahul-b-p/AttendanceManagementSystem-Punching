import { Router } from "express";
import { attendanceController } from "../controllers";
import { roleAuth, validateReqBody } from "../middlewares";
import { createAttendanceSchema, punchInSchema, updateAttendanceSchema } from "../schemas";
import { Roles } from "../enums";



export const router = Router();


router.post('/punchIn', validateReqBody(punchInSchema), attendanceController.punchIn);

router.put('/punchOut', attendanceController.punchOut);

router.post('/:userId', roleAuth(Roles.admin), validateReqBody(createAttendanceSchema), attendanceController.createAttendance);

router.put('/:id', roleAuth(Roles.admin), validateReqBody(updateAttendanceSchema), attendanceController.updateAttendance);

router.delete('/:id', roleAuth(Roles.admin), attendanceController.deleteAttendance);