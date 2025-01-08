export const sendCustomResponse = (message: string, data?: any): Promise<any> => {
    return new Promise((resolve) => {
        resolve({
            success: true,
            message,
            ...(data !== undefined && { data }),
        });
    });
};
