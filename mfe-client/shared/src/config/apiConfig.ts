// API URL helpers for MFEs that consume @mfe/shared as a library.
//
// Base URLs are injected at build time from mfe-client/dev.config.json — do not
// hardcode ports here. In dev they point at the `kubectl port-forward` tunnels
// opened by `pnpm dev`; in prod builds they all point at the ingress host.
declare const __API_ENDPOINTS__: Record<string, string>;

const { AUTH, PRODUCT, CART } = __API_ENDPOINTS__;

export const getAuthUrl = (endpoint: string = '') => {
	return `${AUTH}/api/users${endpoint}`;
};

export const getProductUrl = (endpoint: string = '') => {
	return `${PRODUCT}/api/product${endpoint}`;
};

export const getCartUrl = (endpoint: string = '') => {
	return `${CART}/api/cart${endpoint}`;
};
