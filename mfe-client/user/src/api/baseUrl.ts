// API clients for the user MFE.
//
// Base URLs are injected at build time from mfe-client/dev.config.json — do not
// hardcode ports here. In dev they point at the `kubectl port-forward` tunnels
// opened by `pnpm dev`; in prod builds they all point at the ingress host.
import axios, { AxiosInstance } from 'axios';

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

// Mounted at /api/v1 so callers read like the routes they hit:
//   POST   /order/new           → POST   /api/v1/order/new
//   GET    /order               → GET    /api/v1/order
//   GET    /order/:id           → GET    /api/v1/order/:id
//   POST   /order/:id/payment   → POST   /api/v1/order/:id/payment
//   PATCH  /order/:id/cancel    → PATCH  /api/v1/order/:id/cancel
export const orderApi = axios.create({
	baseURL: `${ORDER}/api/v1`,
	withCredentials: true,
});

/* ---------------------------------------------------------------------------
 * Session expiry → sign-in.
 *
 * Every protected route behind `requireAuth` answers 401 once the cookie
 * session is gone. Without this each page would render its own "something went
 * wrong", which reads like a broken API when the real cause is a logged-out
 * user. `?next=` is round-tripped so sign-in can return here.
 *
 * /currentuser is deliberately exempt: it 401s by design for anonymous
 * visitors, and redirecting on it would bounce every guest to the login page.
 * ------------------------------------------------------------------------- */
const SIGN_IN_PATH = '/user/auth/signin';

const redirectToSignIn = () => {
	const { pathname, search } = window.location;
	if (pathname.startsWith('/user/auth/')) return;

	const next = encodeURIComponent(`${pathname}${search}`);
	window.location.assign(`${SIGN_IN_PATH}?next=${next}`);
};

const attachAuthGuard = (client: AxiosInstance) => {
	client.interceptors.response.use(
		(response) => response,
		(error) => {
			const url = error.config?.url ?? '';
			if (error.response?.status === 401 && !url.includes('currentuser')) {
				redirectToSignIn();
			}
			return Promise.reject(error);
		},
	);
};

[userServiceApi, cartApi, orderApi].forEach(attachAuthGuard);
