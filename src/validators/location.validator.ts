import { getDistance } from "geolib";
import { MIN_THRESHOLD } from "../config";
import { geocodeAddress } from "../services";
import { Adress, Location, LocationWithRadius } from "../types";
import { logFunctionInfo } from "../utils";
import { FunctionStatus } from "../enums";


/**
 *  Validates an address by geocoding it and comparing the resulting location coordinates with the provided location.
 */
export const validateAdressWithLocation = async (adress: Adress, providedLocation: Location): Promise<boolean> => {
    const functionName = 'validateAdressWithLocation';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const adressString = `${adress.city},${adress.state},${adress.zip_code}`;
        const geoEncodedLocation = await geocodeAddress(adressString);

        if (!geoEncodedLocation || geoEncodedLocation.latitude === undefined || geoEncodedLocation.longitude === undefined) {
            return false;
        }

        const threshold = Number(MIN_THRESHOLD);

        logFunctionInfo(functionName, FunctionStatus.success);
        if (Math.abs(geoEncodedLocation.latitude - providedLocation.latitude) < threshold && Math.abs(geoEncodedLocation.longitude - providedLocation.longitude) < threshold) {
            return true;
        } else {

            return false;
        }
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
}



/**
 * Validates whether a person's location is within the institution's radius.
 *
 * @param personLocation - The location of the person, including latitude and longitude.
 * @param institutionAddress - The address of the institution, including city, state, and postal code.
 * @param institutionRadius - The radius (in meters or kilometers) around the institution's location to check within.
 * @returns {boolean} - Returns `true` if the person's location is within the institution's radius, `false` otherwise.
 */
export const validateLocationWithinInstitutionRadius = (personLocation: Location, institutionLocation: Location, institutionRadius: number): boolean => {
    const functionName = 'validateLocationWithinInstitutionRadius';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        if (!personLocation || !institutionLocation || institutionRadius <= 0) {
            throw new Error('Invalid input parameters.');
        }

        const distance = getDistance(personLocation, institutionLocation);
        logFunctionInfo(functionName, FunctionStatus.success);
        return distance <= institutionRadius;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(`Error validating location: ${error.message}`);
    }
}



/**
 * Validates whether a person's location falls within the radius of any institution's location.
 *
 * @param personLocation - The location of the person, including latitude and longitude.
 * @param allInstitutionLocationsWithRadius - An array of institution locations with their respective radius and IDs.
 * @returns { { officeId: string } | null } - Returns the ID of the first institution where the person's location is valid,
 *                                            or `null` if no institution matches the criteria.
 */
export const validateLocationWithinMultipleInstitutionsRadius = (personLocation: Location, allInstitutionLocationsWithRadius: LocationWithRadius[]): { officeId: string } | null => {
    const functionName = 'validateLocationWithinMultipleInstitutionsRadius';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const matchingInstitution = allInstitutionLocationsWithRadius.find(({ _id, radius, ...institutionLocation }) =>
            getDistance(personLocation, institutionLocation) <= radius
        );

        logFunctionInfo(functionName, FunctionStatus.success);
        return matchingInstitution ? { officeId: matchingInstitution._id.toString() } : null;
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw new Error(error.message);
    }
};
