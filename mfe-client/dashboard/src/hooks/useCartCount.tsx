import { useCallback, useEffect, useState } from 'react';

import { cartApi } from '../api/baseUrl';

/**
 * Event other parts of the app fire after changing the cart, so the header
 * badge updates without prop-drilling through the storefront or refetching on
 * every render. Dispatched by ProductDetails after a successful add.
 */
export const CART_UPDATED_EVENT = 'ecom:cart-updated';

export const notifyCartUpdated = () => {
	window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
};

/**
 * Total units in the signed-in user's cart, for the header badge.
 * A failure (including the 401 of an anonymous visitor) means "show nothing" —
 * the badge is decoration, it must never surface an error.
 */
export const useCartCount = () => {
	const [count, setCount] = useState(0);

	const refresh = useCallback(async () => {
		try {
			const { data } = await cartApi.get('/');
			const items: { quantity: number }[] = data?.carts ?? [];
			setCount(items.reduce((sum, item) => sum + (item.quantity ?? 0), 0));
		} catch {
			setCount(0);
		}
	}, []);

	useEffect(() => {
		refresh();

		window.addEventListener(CART_UPDATED_EVENT, refresh);
		return () => window.removeEventListener(CART_UPDATED_EVENT, refresh);
	}, [refresh]);

	return { count, refresh };
};
