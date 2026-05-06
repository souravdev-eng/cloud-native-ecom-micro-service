// API Configuration for MFE Applications
// Backend via port-forward (run: ./scripts/start-backend.sh)

const AUTH_API = 'http://localhost:3100';
const PRODUCT_API = 'http://localhost:4100';
const CART_API = 'http://localhost:4200';

export const getAuthUrl = (endpoint: string = '') => {
	return `${AUTH_API}/api/users${endpoint}`;
};

export const getProductUrl = (endpoint: string = '') => {
	return `${PRODUCT_API}/api/product${endpoint}`;
};

export const getCartUrl = (endpoint: string = '') => {
	return `${CART_API}/api/cart${endpoint}`;
};
