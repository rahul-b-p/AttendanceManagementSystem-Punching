import { Types } from "mongoose";
import { OfficeSortKeys } from "../enums";
import { IOffice } from "../interfaces";
import { PageInfo } from "./page.type";
import { UserToShow } from "./user.type";

export type Adress = {
    street: string;
    city: string;
    state: string;
    zip_code: string;
}

export type Location = {
    latitude: number;
    longitude: number;
}
type BaseOfficeFeilds = {
    officeName: string;
    radius: number;
}
export type CreateOfficeInputBody = Adress & Location & BaseOfficeFeilds;

export type updateOfficeInputBody = Partial<CreateOfficeInputBody>;

export type InsertOfficeArgs = BaseOfficeFeilds & {
    adress: Adress;
    location: Location;
}

export type UpdateOfficeArgs = Partial<BaseOfficeFeilds> & {
    adress: Adress;
    location: Location;
}

export type officeQuery = {
    state?: string;
    city?: string;
}

export type OfficeFetchResult = PageInfo & {
    data: OfficeWithUserData[];
}

export type OfficeFilterBody = {
    pageNo: string;
    pageLimit: string;
    state?: string;
    city?: string;
    sortKey?: OfficeSortKeys;
    officeName?: string;
}

export type OfficeWithUserData = Omit<IOffice, ' managers' | 'employees'> & {
    managers: UserToShow[],
    employees: UserToShow[]
}

export type LocationWithRadius = Location & {
    _id: Types.ObjectId;
    radius: number;
}