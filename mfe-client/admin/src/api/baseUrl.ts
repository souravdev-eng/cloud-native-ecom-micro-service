// API Configuration for Admin MFE Application
import axios from "axios";

// Backend via port-forward (run: ./scripts/start-backend.sh)
const AUTH_API_URL = 'http://localhost:3100';
const PRODUCT_API_URL = 'http://localhost:4100';

export const baseUrl = axios.create({
    baseURL: AUTH_API_URL,
    withCredentials: true,
});

export const authServiceApi = axios.create({
    baseURL: `${AUTH_API_URL}/api/users`,
    withCredentials: true,
});

export const productServiceApi = axios.create({
    baseURL: `${PRODUCT_API_URL}/api/product`,
    withCredentials: true,
});