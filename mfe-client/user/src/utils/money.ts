/**
 * Formats an order amount using the currency the order itself reports.
 *
 * Orders carry their own ISO-4217 code (order service defaults to INR), so
 * order screens must never hardcode a symbol — otherwise an INR total renders
 * as "$1,299" and the number on screen stops matching the API response.
 *
 * `amount` is in whole currency units, matching `orders.totalAmount` /
 * `order_items.price` (integer columns, see order/src/models/product.ts).
 */
export const formatMoney = (amount: number, currency = 'INR'): string => {
	try {
		return new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency,
			maximumFractionDigits: 2,
		}).format(amount);
	} catch {
		// Unknown/blank currency code — show the number rather than throwing.
		return `${currency} ${amount.toLocaleString()}`;
	}
};

/** Human-readable label for each `order_status` enum value. */
export const ORDER_STATUS_LABEL: Record<string, string> = {
	created: 'Awaiting checkout',
	awaiting_payment: 'Awaiting payment',
	paid: 'Paid',
	cancelled: 'Cancelled',
	complete: 'Completed',
};

/** Badge colours per status — kept next to the labels so they stay in sync. */
export const ORDER_STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
	created: { bg: '#f1f3f5', fg: '#495057' },
	awaiting_payment: { bg: '#fff4e6', fg: '#d9480f' },
	paid: { bg: '#e6fcf5', fg: '#087f5b' },
	cancelled: { bg: '#fff5f5', fg: '#c92a2a' },
	complete: { bg: '#e7f5ff', fg: '#1971c2' },
};

/** Only these two are cancellable — mirrors the guard in order.service.ts. */
export const isCancellable = (status: string): boolean =>
	status === 'created' || status === 'awaiting_payment';

/** An order in one of these states still needs paying. */
export const isPayable = (status: string): boolean =>
	status === 'created' || status === 'awaiting_payment';

export const formatOrderDate = (iso: string): string => {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '—';
	return date.toLocaleString(undefined, {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

/** First 8 chars of the uuid — enough to identify an order on screen. */
export const shortOrderId = (id: string): string => id.slice(0, 8).toUpperCase();
