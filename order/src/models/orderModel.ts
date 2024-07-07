import mongoose from 'mongoose';

const OrderStatus = {
  CREATED: 'created',
  PAYMENT_WAITING: 'payment-waiting',
  SUCCESS: 'success',
  TIMEOUT: 'timeout',
  FAILED: 'failed',
};

interface OrderAttr {
  userId: string;
  carts: string[];
}

const orderSchema = new mongoose.Schema({
  userId: String,
  carts: [mongoose.Schema.Types.ObjectId],
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.CREATED,
  },
  expiresAt: {
    type: mongoose.Schema.Types.Date,
  },
});
