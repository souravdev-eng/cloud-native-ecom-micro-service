// API clients for the user MFE.
//
// Base URLs are injected at build time from mfe-client/dev.config.json — do not
// hardcode ports here. In dev they point at the `kubectl port-forward` tunnels
// opened by `pnpm dev`; in prod builds they all point at the ingress host.
import axios from 'axios';

declare const __API_ENDPOINTS__: Record<string, string>;

const { AUTH, CART, ORDER } = __API_ENDPOINTS__;

export const baseUrl = axios.create({
	baseURL: AUTH,
	withCredentials: true,
});

export const userServiceApi = axios.create({
	baseURL: `${AUTH}/api/users`,
	withCredentials: true,
});

export const cartApi = axios.create({
	baseURL: `${CART}/api/cart`,
	withCredentials: true,
});

export const orderApi = axios.create({
	baseURL: `${ORDER}/api`,
	withCredentials: true,
});
