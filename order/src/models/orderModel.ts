import mongoose from 'mongoose';
import { shippingAddressSchema } from './shippingAddressModel';
import { OrderDocument, OrderStatus, PaymentStatus, OrderAttrs } from '../types/order.type';

// Interface for the static method
interface OrderModel extends mongoose.Model<OrderDocument> {
  build(attrs: OrderAttrs): OrderDocument;
}

// OrderItem sub-document schema
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
    },
    productTitle: {
      type: String,
      required: true,
    },
    productPrice: {
      type: Number,
      required: true,
    },
    productImage: {
      type: String,
      required: true,
    },
    sellerId: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    inventoryReserved: {
      type: Boolean,
      default: false,
    },
    inventoryReservedAt: {
      type: Date,
    },
  },
  {
    _id: false, // Prevent automatic _id generation for sub-documents
  }
);

// Main Order schema
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    orderItems: [orderItemSchema],
    orderStatus: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.CREATED,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },

    // Order Details
    subtotal: {
      type: Number,
      required: true,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    shippingAmount: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    // Payment Information
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentIntentId: String,

    // Timestamps
    expiresAt: {
      type: Date,
      // Set expiration 15 minutes from creation
      default: () => new Date(Date.now() + 15 * 60 * 1000),
    },
    paidAt: Date,
    shippedAt: Date,
    deliveredAt: Date,

    // Metadata
    notes: String,
    cancellationReason: String,
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// Static method to build an order
orderSchema.statics.build = (attrs: OrderAttrs) => {
  return new Order(attrs);
};

// Index for efficient queries
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ expiresAt: 1 });

const Order = mongoose.model<OrderDocument, OrderModel>('Order', orderSchema);

export { Order };
