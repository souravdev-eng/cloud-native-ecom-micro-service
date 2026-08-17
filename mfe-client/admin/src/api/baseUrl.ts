// API clients for the admin MFE.
//
// Base URLs are injected at build time from mfe-client/dev.config.json — do not
// hardcode ports here. In dev they point at the `kubectl port-forward` tunnels
// opened by `pnpm dev`; in prod builds they all point at the ingress host.
import axios from 'axios';

declare const __API_ENDPOINTS__: Record<string, string>;

const { AUTH, PRODUCT } = __API_ENDPOINTS__;

export const baseUrl = axios.create({
	baseURL: AUTH,
	withCredentials: true,
});

export const authServiceApi = axios.create({
	baseURL: `${AUTH}/api/users`,
	withCredentials: true,
});

export const productServiceApi = axios.create({
	baseURL: `${PRODUCT}/api/product`,
	withCredentials: true,
});
