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