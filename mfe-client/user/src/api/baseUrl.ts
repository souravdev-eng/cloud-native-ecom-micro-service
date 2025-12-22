// API Configuration for MFE Applications
import axios from "axios";

export const baseUrl = axios.create({
    baseURL: 'https://ecom.dev',
    // withCredentials: true,
});

export const userServiceApi = axios.create({
    baseURL: `${baseUrl}/api/users`,
    // withCredentials: true,
});
