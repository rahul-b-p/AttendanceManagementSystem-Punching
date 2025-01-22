import { Router } from "express";
import { attendanceController } from "../controllers";
import { validateReqBody } from "../middlewares";
import { punchInSchema } from "../schemas";



export const router = Router();


router.post('/punchIn', validateReqBody(punchInSchema), attendanceController.punchIn);

router.put('/punchOut', attendanceController.punchOut);