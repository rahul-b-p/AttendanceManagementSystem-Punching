import { Actions } from "../enums"
import { logger } from "./logger";


export const getAction = (method: string):Actions => {
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
            default: throw new Error("Can't Fetch request method");
        }
        return Action as Actions;
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}