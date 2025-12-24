import axios from "axios"

export const baseUrl = "http://localhost:4100/api"
export const cartUrl = "http://localhost:4200/api"

export const productApi = axios.create({
    baseURL: `${baseUrl}/product`,
    withCredentials: true,
})

export const cartApi = axios.create({
    baseURL: `${cartUrl}/cart`,
    withCredentials: true,
})