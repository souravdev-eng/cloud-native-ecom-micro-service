import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { orderApi } from '../../api/baseUrl';
import { parseErrorMessage } from '../../utils/parseError';
import { usePayOrder } from '../../hooks/usePayOrder';
import type { Order } from '../../types/order';

/**
 * Drives the single-order screen: GET /api/v1/order/:id, plus the two actions
 * available on it — PATCH /order/:id/cancel and resuming payment.
 */
export const useOrderDetails = () => {
	const { id } = useParams<{ id: string }>();

	const [order, setOrder] = useState<Order | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [cancelling, setCancelling] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);

	// Card form is hidden until the user asks to pay, so the page isn't
	// dominated by a Stripe input for orders that are already settled.
	const [showCardForm, setShowCardForm] = useState(false);

	const payment = usePayOrder();

	const fetchOrder = useCallback(async () => {
		if (!id) return;
		setLoading(true);
		setError(null);
		try {
			const { data } = await orderApi.get<Order>(`/order/${id}`);
			setOrder(data);
		} catch (err) {
			setError(parseErrorMessage(err, 'Failed to load this order'));
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		fetchOrder();
	}, [fetchOrder]);

	const cancel = useCallback(async () => {
		if (!id) return;
		setCancelling(true);
		setActionError(null);
		setNotice(null);
		try {
			// The route returns the updated order, so there's no need to refetch.
			const { data } = await orderApi.patch<Order>(`/order/${id}/cancel`);
			setOrder(data);
			setNotice('Order cancelled. Reserved stock has been released.');
			setShowCardForm(false);
		} catch (err) {
			setActionError(parseErrorMessage(err, 'Could not cancel this order'));
		} finally {
			setCancelling(false);
		}
	}, [id]);

	const pay = useCallback(async () => {
		if (!id || !order) return;

		setActionError(null);
		setNotice(null);

		// pay() polls the order while it waits for the webhook and hands back the
		// freshest copy — read it from the result, not from payment.order, which
		// still holds this render's value.
		const result = await payment.pay(id);

		if (result.order) setOrder(result.order);
		if (result.paid) {
			setShowCardForm(false);
			setNotice('Payment received — this order is now paid.');
		}
	}, [id, order, payment]);

	return {
		order,
		loading,
		error,
		cancelling,
		actionError,
		notice,
		showCardForm,
		openCardForm: () => {
			setShowCardForm(true);
			payment.reset();
		},
		closeCardForm: () => setShowCardForm(false),
		cancel,
		pay,
		payment,
		refetch: fetchOrder,
		dismissNotice: () => setNotice(null),
	};
};
