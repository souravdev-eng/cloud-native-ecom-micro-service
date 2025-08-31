import mongoose from 'mongoose';

// Order Status Enums
export enum OrderStatus {
  // Initial States
  CREATED = 'created',
  PAYMENT_PENDING = 'payment-pending',

  // Success States
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',

  // Failure States
  PAYMENT_FAILED = 'payment-failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

// Supporting Interfaces
export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
}

export interface OrderItem {
  // Product snapshot at time of order (immutable)
  productId: string;
  productTitle: string;
  productPrice: number;
  productImage: string;
  sellerId: string;

  // Order-specific details
  quantity: number;
  unitPrice: number; // Price at time of order
  subtotal: number; // quantity * unitPrice

  // Inventory tracking
  inventoryReserved: boolean;
  inventoryReservedAt?: Date;
}

export interface OrderDocument extends mongoose.Document {
  id: string;
  userId: string;
  orderItems: OrderItem[];
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;

  // Order Details
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;

  // Shipping Information
  shippingAddress: ShippingAddress;

  // Payment Information
  paymentMethod: string;
  paymentIntentId?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;

  // Metadata
  notes?: string;
  cancellationReason?: string;
}

export interface OrderAttrs {
  userId: string;
  orderItems: OrderItem[];
  subtotal: number;
  taxAmount?: number;
  shippingAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  notes?: string;
}
