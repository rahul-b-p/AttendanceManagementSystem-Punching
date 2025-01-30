import { geocoder } from '../config';
import { FunctionStatus } from '../enums';
import { logFunctionInfo } from '../utils';
import { Entry } from 'node-geocoder';



// geocode an adress to get its geographical details
export const geocodeAddress = async (address: string): Promise<Entry | null> => {
    const functionName = 'geocodeAddress';
    logFunctionInfo(functionName, FunctionStatus.start);

    try {
        const geocodeResponse = await geocoder.geocode(address);

        logFunctionInfo(functionName, FunctionStatus.success);
        if (geocodeResponse.length === 0) return null
        else return geocodeResponse[0];
    } catch (error: any) {
        logFunctionInfo(functionName, FunctionStatus.fail, error.message);
        throw error;
    }
}
