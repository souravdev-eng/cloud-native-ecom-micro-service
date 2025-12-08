import axios from "axios";

// Use protocol-relative URL to match the current page protocol (http/https)
// This prevents mixed content errors
export const baseUrl = "//ecom.dev/api";

export const authApi = axios.create({
    baseURL: `${baseUrl}/users`,
    withCredentials: true, // Send cookies with requests
});

export const productApi = axios.create({
    baseURL: `${baseUrl}/product`,
    withCredentials: true, // Send cookies with requests
});

export const cartApi = axios.create({
    baseURL: `${baseUrl}/cart`,
    withCredentials: true, // Send cookies with requests
});
