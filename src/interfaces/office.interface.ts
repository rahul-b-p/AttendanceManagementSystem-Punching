import { Document, Types } from "mongoose";
import { Adress, Location } from "../types";

export interface IOffice extends Document {
    _id: Types.ObjectId;
    name: string;
    adress: Adress;
    location: Location;
    radius: number;
    managers: Types.ObjectId[];
    employees: Types.ObjectId[];
}