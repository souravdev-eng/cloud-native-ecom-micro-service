// API Configuration for MFE Applications
import axios from "axios";

// Backend via port-forward (run: ./scripts/start-backend.sh)
const AUTH_API_URL = 'http://localhost:3100';
const CART_API_URL = 'http://localhost:4200';
const ORDER_API_URL = 'http://localhost:4000';

export const baseUrl = axios.create({
    baseURL: AUTH_API_URL,
    withCredentials: true,
});

export const userServiceApi = axios.create({
    baseURL: `${AUTH_API_URL}/api/users`,
    withCredentials: true,
});

export const cartApi = axios.create({
    baseURL: `${CART_API_URL}/api/cart`,
    withCredentials: true,
});

export const orderApi = axios.create({
    baseURL: `${ORDER_API_URL}/api`,
    withCredentials: true,
});