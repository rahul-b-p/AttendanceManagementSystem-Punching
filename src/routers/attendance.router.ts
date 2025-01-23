import { Router } from "express";
import { attendanceController } from "../controllers";
import { roleAuth, validateReqBody, validateReqQuery } from "../middlewares";
import { attendnaceFilterQuerySchema, attendnaceSummaryQuerySchema, createAttendanceSchema, punchInSchema, updateAttendanceSchema } from "../schemas";
import { Roles } from "../enums";



export const router = Router();


router.post('/punchIn', validateReqBody(punchInSchema), attendanceController.punchInAttendance);

router.put('/punchOut', attendanceController.punchOutAttendance);

router.post('/:userId', roleAuth(Roles.admin), validateReqBody(createAttendanceSchema), attendanceController.createAttendance);

router.put('/:id', roleAuth(Roles.admin), validateReqBody(updateAttendanceSchema), attendanceController.updateAttendance);

router.delete('/:id', roleAuth(Roles.admin), attendanceController.deleteAttendance);

router.get('/', validateReqQuery(attendnaceFilterQuerySchema), attendanceController.readAllAttendance);

router.get('/summary', roleAuth(Roles.admin, Roles.manager), validateReqQuery(attendnaceSummaryQuerySchema), attendanceController.attendanceSummary);