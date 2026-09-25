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

export interface OrderAddress {
	id: string;
	orderId: string;
	fullName: string;
	phone: string;
	addressLine1: string;
	addressLine2?: string | null;
	city: string;
	state: string;
	postalCode: string;
	country: string;
	createdAt: string;
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
	shippingAddress?: OrderAddress;
}

/** Response shape of GET /api/v1/order. */
export interface OrderListResponse {
	count: number;
	limit: number;
	offset: number;
	orders: Order[];
}
