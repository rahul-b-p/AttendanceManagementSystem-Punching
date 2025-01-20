import { OfficeSortKeys } from "../enums";
import { IOffice } from "../interfaces";
import { PageInfo } from "./page.type";

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

export type InsertOfficeArgs = BaseOfficeFeilds & {
    adress: Adress;
    location: Location;
}

export type officeQuery = {
    state?: string;
    city?: string;
}

export type OfficeFetchResult = PageInfo & {
    data: IOffice[];
}

export type OfficeFilterBody = {
    pageNo: string;
    pageLimit: string;
    state?: string;
    city?: string;
    sortKey?: OfficeSortKeys;
}