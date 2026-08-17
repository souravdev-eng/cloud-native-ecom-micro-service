// API clients for the dashboard MFE.
//
// Base URLs are injected at build time from mfe-client/dev.config.json — do not
// hardcode ports here. In dev they point at the `kubectl port-forward` tunnels
// opened by `pnpm dev`; in prod builds they all point at the ingress host.
import axios from 'axios';

declare const __API_ENDPOINTS__: Record<string, string>;

const { AUTH, PRODUCT, CART } = __API_ENDPOINTS__;

export const baseUrl = `${PRODUCT}/api`;
export const cartUrl = `${CART}/api`;

export const productApi = axios.create({
	baseURL: `${PRODUCT}/api/product`,
	withCredentials: true,
});

export const productSearchApi = axios.create({
	baseURL: `${PRODUCT}/api/product/search`,
	withCredentials: true,
});

export const cartApi = axios.create({
	baseURL: `${CART}/api/cart`,
	withCredentials: true,
});

export const authApi = axios.create({
	baseURL: `${AUTH}/api/users`,
	withCredentials: true,
});
