export const handleErrorResponse = (payload: any) => {
    if (payload) {
        return Array.isArray(payload) ? payload : [payload];
    } else {
        return null;
    }
};
