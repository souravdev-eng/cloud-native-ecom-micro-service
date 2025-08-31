import { Request, Response, NextFunction } from 'express';
import { NotFoundError, BadRequestError } from '@ecom-micro/common';
import { Order } from '../models/orderModel';
import { OrderItem, ShippingAddress, OrderStatus } from '../types/order.type';
import { Cart, CartDocument } from '../models/cart';
import {
  reserveInventory,
  calculateTax,
  calculateShipping,
  validateProductAvailability,
} from '../utils/orderUtil';
import { ProductQuantityUpdatePublisher } from '../queue/publisher/productQuantityUpdatePublisher';
import { rabbitMQWrapper } from '../rabbitMQWrapper';

interface CheckoutRequest {
  cartIds: string[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  notes?: string;
}

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cartIds, shippingAddress, paymentMethod, notes }: CheckoutRequest = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return next(new BadRequestError('User authentication required'));
    }

    if (!cartIds || cartIds.length === 0) {
      return next(new BadRequestError('At least one cart item is required'));
    }

    // Step 1: Fetch cart data from local cart snapshots
    const cartData = await fetchLocalCartData(cartIds, userId);

    if (cartData.length === 0) {
      return next(new NotFoundError('No valid cart items found'));
    }

    // Step 2: Validate product availability
    validateProductAvailability(cartData);

    // Step 3: Transform cart data to order items
    const orderItems: OrderItem[] = cartData.map((cart) => ({
      productId: cart.productId,
      productTitle: cart.productTitle,
      productPrice: cart.productPrice,
      productImage: cart.productImage,
      sellerId: cart.sellerId,
      quantity: cart.cartQuantity,
      unitPrice: cart.productPrice,
      subtotal: cart.total,
      inventoryReserved: false,
    }));

    // Step 4: Calculate order totals
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = calculateTax(subtotal);
    const shippingAmount = calculateShipping(subtotal);
    const discountAmount = 0; // Can be enhanced with discount logic
    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

    // Step 5: Create order
    const order = Order.build({
      userId,
      orderItems,
      subtotal,
      taxAmount,
      shippingAmount,
      discountAmount,
      totalAmount,
      shippingAddress,
      paymentMethod,
      notes,
    });

    await order.save();

    // TODO: Step 6: Reserve inventory (async operation)
    // try {
    //   await reserveInventory(orderItems, order.id);

    //   // Update inventory reservation status
    //   order.orderItems.forEach((item: any) => {
    //     item.inventoryReserved = true;
    //     item.inventoryReservedAt = new Date();
    //   });
    //   await order.save();
    // } catch (error) {
    //   console.error('Inventory reservation failed:', error);
    //   // Mark order as failed and continue - can be retried later
    //   order.orderStatus = OrderStatus.PAYMENT_FAILED;
    //   await order.save();

    //   return next(new BadRequestError('Unable to reserve inventory for some items'));
    // }

    // Step 7: Return order confirmation
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order.id,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        shippingAmount: order.shippingAmount,
        totalAmount: order.totalAmount,
        orderItems: order.orderItems,
        shippingAddress: order.shippingAddress,
        expiresAt: order.expiresAt,
        createdAt: order.createdAt,
      },
    });

    // TODO: Step 8: Publish OrderCreatedEvent (will be implemented in messaging phase)
    console.log(`Order created: ${order.id} for user: ${userId}`);

    for (const item of order.orderItems) {
      new ProductQuantityUpdatePublisher(rabbitMQWrapper.channel).publish({
        id: item.productId,
        quantity: item.quantity,
        sellerId: item.sellerId,
      });
    }
  } catch (error: any) {
    console.error('Order creation failed:', error);
    return next(new BadRequestError(error.message || 'Order creation failed'));
  }
};

// Helper function to fetch cart data from local cart snapshots
async function fetchLocalCartData(cartIds: string[], userId: string): Promise<CartDocument[]> {
  try {
    const carts = await Cart.find({
      cartId: { $in: cartIds },
      userId,
    });

    if (carts.length !== cartIds.length) {
      const foundCartIds = carts.map((cart) => cart.cartId);
      const missingCartIds = cartIds.filter((id) => !foundCartIds.includes(id));
      console.warn(`Some cart items not found: ${missingCartIds.join(', ')}`);
    }

    return carts;
  } catch (error) {
    console.error('Failed to fetch cart data:', error);
    throw new Error('Unable to fetch cart data');
  }
}
