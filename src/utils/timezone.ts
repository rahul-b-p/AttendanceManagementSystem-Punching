import { find } from "geo-tz";
import { Location } from "../types";
import { logFunctionInfo } from "./logger";
import { FunctionStatus } from "../enums";
import { errorMessage } from "../constants";



/**
 * To get timezone of given location
*/
export const getTimeZoneOfLocation = (location: Location) => {
    logFunctionInfo('getTimeZoneOfLocation', FunctionStatus.start);

    const timezone = find(location.latitude, location.longitude);
    if (timezone.length <= 0) throw Error(errorMessage.NO_TIMEZONE_FOUND);

    return timezone[0];
}
