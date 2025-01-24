import { Router } from "express";
import { attendanceController } from "../controllers";
import { roleAuth, validateReqBody, validateReqQuery } from "../middlewares";
import { attendnaceFilterQuerySchema, attendnaceSummaryQuerySchema, createAttendanceSchema, punchInSchema, updateAttendanceSchema } from "../schemas";
import { Roles } from "../enums";



export const router = Router();

// API to punchin Attendance by a user
router.post('/punchIn', validateReqBody(punchInSchema), attendanceController.punchInAttendance);

// API to punchout Attendnace by a user
router.put('/punchOut', attendanceController.punchOutAttendance);

// API to create Attendnace data for a specific user -- only for admin
router.post('/:userId', roleAuth(Roles.admin), validateReqBody(createAttendanceSchema), attendanceController.createAttendance);

// API to update an existing attendnace data -- only for admin
router.put('/:id', roleAuth(Roles.admin), validateReqBody(updateAttendanceSchema), attendanceController.updateAttendance);

// API to delete an existing attendnace data -- only for admin
router.delete('/:id', roleAuth(Roles.admin), attendanceController.deleteAttendance);

// API to fetch all attendnace data by filtering, sorting and pagenation --role based access of reading
router.get('/', validateReqQuery(attendnaceFilterQuerySchema), attendanceController.readAllAttendance);

// API to fetch attendnace summary of a specific user in a date range -- Admin or Manager can access
router.get('/summary', roleAuth(Roles.admin, Roles.manager), validateReqQuery(attendnaceSummaryQuerySchema), attendanceController.attendanceSummary);