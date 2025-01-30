import * as dns from 'dns';
import { logFunctionInfo } from '../utils';
import { FunctionStatus } from '../enums';



/**
 * Checks the validity of an email address by verifying the existence of its domain's mail exchange (MX) records.
*/
export const checkEmailValidity = (email: string): Promise<boolean> => {
    const functionName = 'checkEmailValidity';
    logFunctionInfo(functionName, FunctionStatus.start);
    return new Promise((resolve, reject) => {
        const domain = email.split('@')[1];
        if (!domain) {
            return resolve(false);
        }

        try {
            dns.resolveMx(domain, (err, addresses) => {
                if (err) {
                    return resolve(false);
                }

                logFunctionInfo(functionName, FunctionStatus.fail);
                resolve(addresses && addresses.length > 0);
            });
        } catch (error: any) {
            logFunctionInfo(functionName,FunctionStatus.fail);
            reject(error)
        }
    });
}