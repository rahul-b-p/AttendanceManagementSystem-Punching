import { geocoder } from '../config';
import { logger } from '../utils';
import { Entry } from 'node-geocoder';




export const geocodeAddress = async (address: string): Promise<Entry | null> => {
    try {
        const geocodeResponse = await geocoder.geocode(address);
        if (geocodeResponse.length === 0) return null
        else return geocodeResponse[0];
    } catch (error) {
        logger.error(error);
        throw error;
    }
}
