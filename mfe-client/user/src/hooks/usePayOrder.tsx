import { useCallback, useRef, useState } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

import { orderApi } from '../api/baseUrl';
import { parseErrorMessage } from '../utils/parseError';
import type { Order } from '../types/order';

/* ============================================================================
 * Paying for an order that already exists.
 * ============================================================================
 * Used by checkout (right after the order is created) and by order detail
 * (resuming an unpaid order). The sequence is fixed by the backend design:
 *
 *   1. POST /api/v1/order/:id/payment   → { clientSecret }
 *   2. stripe.confirmCardPayment(clientSecret, { payment_method: { card } })
 *   3. the order flips to "paid" when Stripe calls
 *      POST /api/v1/order/webhook/stripe — NOT on the response to step 2.
 *
 * Step 3 is why this hook polls GET /api/v1/order/:id afterwards instead of
 * declaring success as soon as the card clears. There is deliberately no
 * "confirm payment" endpoint to call: trusting the browser to report a
 * successful charge would let anyone mark their own order paid.
 *
 * When the poll times out the card DID clear — only the webhook hasn't landed.
 * That distinction is surfaced as its own stage so a missing/misconfigured
 * webhook looks different from a failed payment.
 * ========================================================================== */

export type PayStage =
	| 'idle'
	| 'creating_intent' // POST /order/:id/payment
	| 'confirming_card' // Stripe.js confirmCardPayment
	| 'awaiting_webhook' // card cleared, polling for status === paid
	| 'webhook_pending' // card cleared, poll gave up
	| 'succeeded'
	| 'failed';

export interface PayResult {
	/** True only once the order is actually `paid` server-side. */
	paid: boolean;
	/** Freshest copy of the order this hook saw, or null if it never loaded one. */
	order: Order | null;
}

export interface BillingDetails {
	name?: string;
	phone?: string;
	address?: {
		line1?: string;
		line2?: string;
		city?: string;
		state?: string;
		postal_code?: string;
		country?: string;
	};
}

// ~30s of polling. Long enough for a local Stripe CLI forward to deliver the
// event, short enough that a broken webhook doesn't leave a spinner forever.
const POLL_INTERVAL_MS = 2000;
const POLL_ATTEMPTS = 15;

const PAID_STATUSES = ['paid', 'complete'];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const usePayOrder = () => {
	const stripe = useStripe();
	const elements = useElements();

	const [stage, setStage] = useState<PayStage>('idle');
	const [error, setError] = useState<string | null>(null);
	const [order, setOrder] = useState<Order | null>(null);
	const [pollAttempt, setPollAttempt] = useState(0);
	// Which step broke, so PaymentProgress can mark the earlier ones as done.
	const [failedAt, setFailedAt] = useState<PayStage | null>(null);

	// Guards against a double-click firing two PaymentIntents for one order.
	const inFlight = useRef(false);

	const reset = useCallback(() => {
		setStage('idle');
		setError(null);
		setFailedAt(null);
		setPollAttempt(0);
	}, []);

	/**
	 * Polls the order until the webhook has marked it paid.
	 * Returns the last copy it managed to read and whether it reached a paid
	 * state — the caller gets it as a return value rather than reading `order`
	 * off the hook, which would still hold the previous render's value.
	 */
	const pollUntilPaid = useCallback(
		async (orderId: string): Promise<PayResult> => {
			let latest: Order | null = null;

			for (let attempt = 1; attempt <= POLL_ATTEMPTS; attempt += 1) {
				setPollAttempt(attempt);
				await sleep(POLL_INTERVAL_MS);

				try {
					const { data } = await orderApi.get<Order>(`/order/${orderId}`);
					latest = data;
					setOrder(data);
					if (PAID_STATUSES.includes(data.status)) {
						return { paid: true, order: data };
					}
				} catch {
					// A transient read failure shouldn't abort the wait — the webhook
					// may still be on its way. Keep polling until attempts run out.
				}
			}
			return { paid: false, order: latest };
		},
		[],
	);

	/**
	 * Runs the whole card flow for an order that already exists.
	 * Resolves true only once the order is actually paid server-side.
	 */
	const pay = useCallback(
		async (orderId: string, billing?: BillingDetails): Promise<PayResult> => {
			const fail = (stageAt: PayStage, message: string): PayResult => {
				setFailedAt(stageAt);
				setStage('failed');
				setError(message);
				return { paid: false, order: null };
			};

			if (inFlight.current) return { paid: false, order: null };

			if (!stripe || !elements) {
				return fail(
					'creating_intent',
					'Stripe has not finished loading yet. Try again in a moment.',
				);
			}

			const card = elements.getElement(CardElement);
			if (!card) {
				return fail('creating_intent', 'Card input not found on the page.');
			}

			inFlight.current = true;
			setError(null);
			setFailedAt(null);

			// Local mirror of the current step. `stage` state can't be read back
			// inside this closure (it holds the value from the render that created
			// the callback), so an unexpected throw needs this to know where it was.
			let step: PayStage = 'creating_intent';

			try {
				/* ---- 1. PaymentIntent ------------------------------------------ */
				setStage('creating_intent');
				const { data } = await orderApi.post<{ clientSecret: string }>(
					`/order/${orderId}/payment`,
				);

				if (!data?.clientSecret) {
					return fail(
						'creating_intent',
						'The order service did not return a clientSecret for this payment.',
					);
				}

				/* ---- 2. Confirm the card --------------------------------------- */
				step = 'confirming_card';
				setStage('confirming_card');
				const { error: confirmError, paymentIntent } =
					await stripe.confirmCardPayment(data.clientSecret, {
						payment_method: { card, billing_details: billing },
					});

				if (confirmError) {
					return fail(
						'confirming_card',
						confirmError.message || 'The card was declined.',
					);
				}

				if (paymentIntent?.status !== 'succeeded') {
					return fail(
						'confirming_card',
						`Stripe left the payment in "${paymentIntent?.status}". Nothing was charged.`,
					);
				}

				/* ---- 3. Wait for the webhook ----------------------------------- */
				step = 'awaiting_webhook';
				setStage('awaiting_webhook');
				const result = await pollUntilPaid(orderId);

				if (result.paid) {
					setStage('succeeded');
					return result;
				}

				// Money moved but the order is still unpaid in our DB.
				setStage('webhook_pending');
				setError(
					'The card was charged, but the order is still not marked paid. ' +
						'The Stripe webhook (POST /api/v1/order/webhook/stripe) has not been ' +
						'processed yet.',
				);
				return result;
			} catch (err) {
				return fail(step, parseErrorMessage(err, 'Payment could not be completed'));
			} finally {
				inFlight.current = false;
			}
		},
		[stripe, elements, pollUntilPaid],
	);

	return {
		pay,
		reset,
		stage,
		failedAt,
		error,
		order,
		pollAttempt,
		pollAttempts: POLL_ATTEMPTS,
		processing:
			stage === 'creating_intent' ||
			stage === 'confirming_card' ||
			stage === 'awaiting_webhook',
		isStripeReady: !!stripe && !!elements,
	};
};
