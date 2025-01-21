import { Document, Types } from "mongoose";
import { Location } from "../types";

interface ILocation extends Document,Location{}

export interface IAttendance extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    punchIn: Date;
    punchOut?: Date;
    location: ILocation;
    officeId: Types.ObjectId;
}