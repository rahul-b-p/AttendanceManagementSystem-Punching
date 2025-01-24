import { Actions } from "../enums"
import { logger } from "./logger";

/**
 * Determines the appropriate action based on the HTTP request method. 
 */
export const getActionFromMethod = (method: string): Actions => {
    try {
        let Action
        switch (method) {
            case 'POST': Action = Actions.create;
                break;
            case 'GET': Action = Actions.read;
                break;
            case 'PUT': Action = Actions.update;
                break;
            case 'DELETE': Action = Actions.delete;
                break;
            case 'PATCH': Action = Actions.update;
                break;
            default: throw new Error("Invalid method");
        }
        return Action as Actions;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}