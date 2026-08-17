import { useCallback, useEffect, useState } from 'react';

import { cartApi, orderApi } from '../../api/baseUrl';
import { usePayOrder } from '../../hooks/usePayOrder';
import { parseErrorMessage } from '../../utils/parseError';
import type { Order } from '../../types/order';

/* ============================================================================
 * Checkout — cart → order → payment.
 * ============================================================================
 * The order service's contract (order/src/routes/) is:
 *
 *   POST  /api/v1/order/new          body { items: [{ productId, quantity }] }
 *                                    → 201, the order object itself
 *   POST  /api/v1/order/:id/payment  → 201 { clientSecret }
 *
 * Only productId + quantity are sent. Title, price and stock are re-read from
 * the service's own product replica, so the totals shown on the confirmation
 * come from the created order — not from the cart figures on this page.
 *
 * Note the cart is NOT cleared here: cart's OrderCreatedListener drops the
 * ordered lines when it consumes the OrderCreated event. If payment then fails,
 * the order still exists in "created" and can be paid from /user/orders/:id.
 * ========================================================================== */

interface CartItem {
	product_id: string;
	cart_id: string;
	title: string;
	image: string;
	price: number;
	quantity: number;
	total: number;
}

export interface ShippingAddress {
	fullName: string;
	addressLine1: string;
	addressLine2?: string;
	city: string;
	state: string;
	postalCode: string;
	country: string;
	phone: string;
}

interface CheckoutState {
	items: CartItem[];
	loading: boolean;
	error: string | null;
	subtotal: number;
	shipping: number;
	tax: number;
	grandTotal: number;
}

const initialShippingAddress: ShippingAddress = {
	fullName: '',
	addressLine1: '',
	addressLine2: '',
	city: '',
	state: '',
	postalCode: '',
	country: 'IN',
	phone: '',
};

const REQUIRED_FIELDS: (keyof ShippingAddress)[] = [
	'fullName',
	'addressLine1',
	'city',
	'state',
	'postalCode',
	'country',
	'phone',
];

export const useCheckout = () => {
	const [checkoutState, setCheckoutState] = useState<CheckoutState>({
		items: [],
		loading: true,
		error: null,
		subtotal: 0,
		shipping: 0,
		tax: 0,
		grandTotal: 0,
	});

	const [shippingAddress, setShippingAddress] =
		useState<ShippingAddress>(initialShippingAddress);
	const [activeStep, setActiveStep] = useState(0);

	// The order created in step 2. Kept even when payment fails, so the page can
	// point at it instead of stranding an unpaid order the user can't find.
	const [order, setOrder] = useState<Order | null>(null);
	const [creatingOrder, setCreatingOrder] = useState(false);
	const [checkoutError, setCheckoutError] = useState<string | null>(null);

	const payment = usePayOrder();

	const fetchCart = useCallback(async () => {
		try {
			setCheckoutState((prev) => ({ ...prev, loading: true, error: null }));
			const response = await cartApi.get('/');
			const items: CartItem[] = response.data.carts || [];
			const subtotal = response.data.total || 0;
			const shipping = subtotal > 100 ? 0 : 9.99;
			const tax = subtotal * 0.08;

			setCheckoutState({
				items,
				loading: false,
				error: null,
				subtotal,
				shipping,
				tax,
				grandTotal: subtotal + shipping + tax,
			});
		} catch (err) {
			setCheckoutState((prev) => ({
				...prev,
				loading: false,
				error: parseErrorMessage(err, 'Failed to load your cart'),
			}));
		}
	}, []);

	useEffect(() => {
		fetchCart();
	}, [fetchCart]);

	const updateShippingAddress = (field: keyof ShippingAddress, value: string) => {
		setShippingAddress((prev) => ({ ...prev, [field]: value }));
	};

	const validateShippingAddress = () =>
		REQUIRED_FIELDS.every((field) => shippingAddress[field]?.trim());

	const handleNextStep = () => {
		if (activeStep === 0 && !validateShippingAddress()) {
			setCheckoutError('Please fill in all required shipping fields');
			return;
		}
		setCheckoutError(null);
		setActiveStep((prev) => prev + 1);
	};

	const handlePrevStep = () => {
		setCheckoutError(null);
		setActiveStep((prev) => Math.max(prev - 1, 0));
	};

	/** Stripe billing details, built from the shipping form. */
	const billingDetails = () => ({
		name: shippingAddress.fullName,
		phone: shippingAddress.phone,
		address: {
			line1: shippingAddress.addressLine1,
			line2: shippingAddress.addressLine2 || undefined,
			city: shippingAddress.city,
			state: shippingAddress.state,
			postal_code: shippingAddress.postalCode,
			country: shippingAddress.country,
		},
	});

	/** POST /api/v1/order/new — returns the created order, or null on failure. */
	const createOrder = useCallback(async (): Promise<Order | null> => {
		setCreatingOrder(true);
		setCheckoutError(null);
		try {
			const items = checkoutState.items.map((item) => ({
				productId: item.product_id,
				quantity: item.quantity,
			}));

			// The route sends the order object directly (201), not { success, order }.
			const { data } = await orderApi.post<Order>('/order/new', { items });

			if (!data?.id) {
				setCheckoutError('The order service responded without an order id.');
				return null;
			}

			setOrder(data);
			return data;
		} catch (err) {
			setCheckoutError(parseErrorMessage(err, 'Could not place your order'));
			return null;
		} finally {
			setCreatingOrder(false);
		}
	}, [checkoutState.items]);

	/**
	 * Place the order, then pay for it. Re-running after a payment failure
	 * reuses the order already created rather than placing a duplicate.
	 */
	const handlePayment = useCallback(async () => {
		const target = order ?? (await createOrder());
		if (!target) return;

		const result = await payment.pay(target.id, billingDetails());

		// pay() polled the order while waiting for the webhook and returns the
		// freshest copy, so the confirmation shows the real server-side total and
		// status. Reading payment.order here would give this render's stale value.
		if (result.order) setOrder(result.order);
		if (result.paid) setActiveStep(2);
	}, [order, createOrder, payment]);

	return {
		...checkoutState,
		shippingAddress,
		updateShippingAddress,
		validateShippingAddress,
		activeStep,
		handleNextStep,
		handlePrevStep,
		handlePayment,
		order,
		creatingOrder,
		checkoutError,
		// A created-but-unpaid order: payment can be retried from here or later
		// from the order page, but the cart lines are already gone.
		hasUnpaidOrder: !!order && payment.stage !== 'succeeded',
		payment,
		processing: creatingOrder || payment.processing,
		paymentSuccess: payment.stage === 'succeeded',
		isStripeReady: payment.isStripeReady,
	};
};
