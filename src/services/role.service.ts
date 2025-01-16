import { CustomRolePermission, ICustomRole } from "../interfaces";
import {CustomRole} from "../models"
import { logger } from "../utils";




export const findCustomRole = async (role: string): Promise<ICustomRole | null> => {
    try {
        return await CustomRole.findOne({ role });
    } catch (error: any) {
        logger.error(error);
        throw new Error(error.message);
    }
}


export const insertRole = async(role:string,permission:CustomRolePermission[])=>{

    try {
        const newRole = new CustomRole({
         role,permission
        })

        newRole.save();
    } catch (error:any) {
        logger.error(error);
        throw new Error(error.message);
    }
}