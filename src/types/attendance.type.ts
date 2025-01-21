import { Location } from "./office.type";




export type AttendancePunchinArgs ={
    userId:string;
    officeId:string;
    location:Location;
    punchIn?:Date;
}