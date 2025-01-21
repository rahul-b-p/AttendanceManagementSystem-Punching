import { Document, Types } from "mongoose";
import { Adress, Location } from "../types";

export interface IOffice extends Document {
    _id: Types.ObjectId;
    officeName: string;
    adress: Adress;
    location: Location;
    radius: number;
    managers: Types.ObjectId[];
    employees: Types.ObjectId[];
    isDeleted: boolean;
}