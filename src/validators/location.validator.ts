import { getDistance } from "geolib";
import { MIN_THRESHOLD } from "../config";
import { geocodeAddress } from "../services";
import { Adress, Location, LocationWithRadius } from "../types";
import { logger } from "../utils";


/**
 *  Validates an address by geocoding it and comparing the resulting location coordinates with the provided location.
 */
export const validateAdressWithLocation = async (adress: Adress, providedLocation: Location): Promise<boolean> => {
    try {
        const adressString = `${adress.city},${adress.state},${adress.zip_code}`;
        const geoEncodedLocation = await geocodeAddress(adressString);

        if (!geoEncodedLocation || geoEncodedLocation.latitude === undefined || geoEncodedLocation.longitude === undefined) {
            return false;
        }

        const threshold = Number(MIN_THRESHOLD);

        if (Math.abs(geoEncodedLocation.latitude - providedLocation.latitude) < threshold && Math.abs(geoEncodedLocation.longitude - providedLocation.longitude) < threshold) {
            return true;
        } else {

            return false;
        }
    } catch (error: any) {
        logger.error(error);
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
    try {
        if (!personLocation || !institutionLocation || institutionRadius <= 0) {
            throw new Error('Invalid input parameters.');
        }

        const distance = getDistance(personLocation, institutionLocation);
        return distance <= institutionRadius;
    } catch (error: any) {
        logger.error(error);
        throw new Error(`Error validating location: ${error.message}`);
    }
}


export const validateLocationWithinMultipleInstitutionsRadius = (personLocation: Location, allInstitutionLocationsWithRadius: LocationWithRadius[]): { officeId: string } | null => {
    try {
        const matchingInstitution = allInstitutionLocationsWithRadius.find(({ _id, radius, ...institutionLocation }) =>
            getDistance(personLocation, institutionLocation) <= radius
        );

        return matchingInstitution ? { officeId: matchingInstitution._id.toString() } : null;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
};
