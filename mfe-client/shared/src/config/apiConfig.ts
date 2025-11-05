// API Configuration for MFE Applications
export const getAuthUrl = (endpoint: string = '') => {
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost';
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev && baseUrl.includes('localhost')) {
        return `${baseUrl}:3001/api/users${endpoint}`;
    }

    return `${baseUrl}/api/users${endpoint}`;
};
