import { useCallback, useEffect, useState } from 'react';

import { orderApi } from '../../api/baseUrl';
import { parseErrorMessage } from '../../utils/parseError';
import type { Order, OrderListResponse } from '../../types/order';

const PAGE_SIZE = 10;

/**
 * Drives GET /api/v1/order.
 *
 * The route clamps `limit` to 100 and returns `{ count, limit, offset, orders }`
 * with no grand total, so "is there another page?" is inferred from a full page
 * coming back — there is nothing else to go on.
 */
export const useOrders = () => {
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [offset, setOffset] = useState(0);
	const [hasMore, setHasMore] = useState(false);

	const fetchOrders = useCallback(async (nextOffset: number) => {
		setLoading(true);
		setError(null);
		try {
			const response = await orderApi.get<OrderListResponse>('/order', {
				params: { limit: PAGE_SIZE, offset: nextOffset },
			});
			const list = response.data.orders ?? [];
			setOrders(list);
			setOffset(nextOffset);
			setHasMore(list.length === PAGE_SIZE);
		} catch (err) {
			setError(parseErrorMessage(err, 'Failed to load your orders'));
			setOrders([]);
			setHasMore(false);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchOrders(0);
	}, [fetchOrders]);

	return {
		orders,
		loading,
		error,
		offset,
		pageSize: PAGE_SIZE,
		hasMore,
		nextPage: () => fetchOrders(offset + PAGE_SIZE),
		prevPage: () => fetchOrders(Math.max(offset - PAGE_SIZE, 0)),
		refetch: () => fetchOrders(offset),
	};
};
