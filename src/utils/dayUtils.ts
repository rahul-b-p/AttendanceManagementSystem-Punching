import { Days } from "../enums";
import { logger } from "./logger";


/**
 * To get mongoDB supported day number 
 */
export const getDayNumber = (days: Days[]): number[] => {
    const dayMap = {
        Sun: 1,  // MongoDB uses 1 for Sunday
        Mon: 2,  // 2 for Monday
        Tue: 3,  // 3 for Tuesday
        Wed: 4,  // 4 for Wednesday
        Thu: 5,  // 5 for Thursday
        Fri: 6,  // 6 for Friday
        Sat: 7   // 7 for Saturday
    };

    const dayNumbers = days.map(day => dayMap[day]);
    return dayNumbers;
}


