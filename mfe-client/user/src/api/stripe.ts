import { loadStripe } from '@stripe/stripe-js';

// Stripe PUBLISHABLE key — safe to ship in the bundle (it can only create
// tokens, never move money). The matching secret key lives in the order
// service's env as STRIPE_SECRET_KEY.
//
// Both MFE pages that take a card (checkout, and resuming payment from order
// detail) load Stripe from here so the key is defined once.
export const STRIPE_PUBLISHABLE_KEY =
	'pk_test_51JOBJnSA4EPPqs66VxVusJrEerUnYWuDGHkzasE78kNncq9UgLx4PwQdU8XPpn41qwz1vhNsxcY14rSQ7fC0c0gt00lNQYG9wa';

// loadStripe injects a <script> tag, so it must be called once at module scope
// rather than inside a component — calling it per render re-adds the script.
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export const CARD_ELEMENT_OPTIONS = {
	style: {
		base: {
			fontSize: '16px',
			color: '#1a1a2e',
			fontFamily: '"Inter", sans-serif',
			'::placeholder': {
				color: '#adb5bd',
			},
		},
		invalid: {
			color: '#c92a2a',
			iconColor: '#c92a2a',
		},
	},
};
