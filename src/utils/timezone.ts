import { find } from "geo-tz";
import { Location } from "../types";
import { logFunctionInfo } from "./logger";
import { FunctionStatus } from "../enums";



/**
 * To get timezone of given location
*/
export const getTimeZoneOfLocation = (location: Location) => {
    logFunctionInfo('getTimeZoneOfLocation', FunctionStatus.start);

    const timezone = find(location.latitude, location.longitude);
    if (timezone.length <= 0) throw Error('No timezone found for the given coordinates.');

    return timezone[0];
}
