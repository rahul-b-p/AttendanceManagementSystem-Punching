import { YYYYMMDD } from "./date.type";
import { Location } from "./office.type";
import { TimeInHHMM } from "./time.type";




export type AttendancePunchinArgs = {
    userId: string;
    officeId: string;
    location: Location;
    punchIn?: Date;
    punchOut?: Date;
}

export type UpdateAttendanceArgs = Partial<AttendancePunchinArgs>;

export type createAttendanceBody = Location & {
    date: YYYYMMDD;
    punchInTime: TimeInHHMM;
    punchOutTime: TimeInHHMM;
}