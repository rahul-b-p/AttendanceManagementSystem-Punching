/**
 * Sends a custom response with a success status, message, and optional data.
 * 
 * @param message - The message to be included in the response.
 * @param data - (Optional) Additional data to be included in the response if provided.
 * @returns An object formatted for `res.json` with the success status, message, and optional data.
 */

export const sendCustomResponse = (message: string, data?: any): Promise<any> => {
    return new Promise((resolve) => {
        resolve({
            success: true,
            message,
            ...(data !== undefined && { data }),
        });
    });
};
