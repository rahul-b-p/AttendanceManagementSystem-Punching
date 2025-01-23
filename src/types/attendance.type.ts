import { AttendanceSortKeys } from "../enums";
import { IAttendance, IOffice } from "../interfaces";
import { YYYYMMDD } from "./date.type";
import { Location } from "./office.type";
import { PageInfo } from "./page.type";
import { TimeInHHMM } from "./time.type";
import { IUserData } from "./user.type";




export type AttendancePunchinArgs = {
    userId: string;
    officeId: string;
    location: Location;
    punchIn?: Date;
    punchOut?: Date;
}

export type UpdateAttendanceArgs = Partial<Omit<AttendancePunchinArgs, 'userId' | 'officeId'>>;

export type createAttendanceBody = Location & {
    date: YYYYMMDD;
    punchInTime: TimeInHHMM;
    punchOutTime: TimeInHHMM;
}

export type updateAttendanceBody = Partial<createAttendanceBody>;

export type AttendanceQuery = {
    date?: YYYYMMDD;
    userId?: string;
    officeId?: string;
}

export type AttendanceToShow = Omit<IAttendance, '__v' | 'userId' | 'officeId'> & {
    office: IOffice;
    user: IUserData;
}

export type AttendanceFetchResult = PageInfo & {
    data: AttendanceToShow[];
}

export type AttendanceFilterQuery = AttendanceQuery & {
    pageNo: string;
    pageLimit: string;
    sortKey?: AttendanceSortKeys;
}