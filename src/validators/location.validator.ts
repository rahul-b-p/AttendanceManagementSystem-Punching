import { MIN_THRESHOLD } from "../config";
import { geocodeAddress } from "../services";
import { Adress, Location } from "../types";
import { logger } from "../utils";


/**
 *  Validates an address by geocoding it and comparing the resulting location coordinates with the provided location.
 */
export const validateAdressWithLocation = async (adress: Adress, providedLocation: Location) => {
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