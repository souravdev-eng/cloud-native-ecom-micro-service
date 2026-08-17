/**
 * Mirrors the order service's `OrderWithItems` (order/src/service/order.service.ts).
 * Amounts are integers in whole currency units, not minor units.
 */
export type OrderStatus =
	| 'created'
	| 'awaiting_payment'
	| 'paid'
	| 'cancelled'
	| 'complete';

export interface OrderItem {
	id: string;
	orderId: string;
	productId: string;
	title: string;
	price: number;
	image: string | null;
	quantity: number;
}

export interface Order {
	id: string;
	userId: string;
	status: OrderStatus;
	totalAmount: number;
	currency: string;
	stripePaymentIntentId: string | null;
	createdAt: string;
	updatedAt: string;
	items: OrderItem[];
}

/** Response shape of GET /api/v1/order. */
export interface OrderListResponse {
	count: number;
	limit: number;
	offset: number;
	orders: Order[];
}
