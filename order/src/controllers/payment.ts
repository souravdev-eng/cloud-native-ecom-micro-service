import { Request, Response, NextFunction } from 'express';
import { BadRequestError, NotFoundError } from '@ecom-micro/common';
import { stripe } from '../stripe';
import { Order } from '../models/orderModel';
import { OrderStatus, PaymentStatus } from '../types/order.type';

/**
 * Create a payment intent for an order
 * POST /api/order/:orderId/payment-intent
 */
export const createPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { orderId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return next(new BadRequestError('User authentication required'));
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return next(new NotFoundError('Order not found'));
        }

        if (order.userId !== userId) {
            return next(new BadRequestError('Not authorized to access this order'));
        }

        if (order.paymentStatus === PaymentStatus.SUCCEEDED) {
            return next(new BadRequestError('Order has already been paid'));
        }

        if (order.orderStatus === OrderStatus.CANCELLED || order.orderStatus === OrderStatus.EXPIRED) {
            return next(new BadRequestError('Cannot pay for cancelled or expired order'));
        }

        // Check if payment intent already exists
        if (order.paymentIntentId) {
            // Retrieve existing payment intent
            const existingIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId);

            if (existingIntent.status === 'succeeded') {
                order.paymentStatus = PaymentStatus.SUCCEEDED;
                order.orderStatus = OrderStatus.PAID;
                order.paidAt = new Date();
                await order.save();

                return res.status(200).json({
                    success: true,
                    message: 'Payment already completed',
                    order: {
                        id: order.id,
                        paymentStatus: order.paymentStatus,
                        orderStatus: order.orderStatus,
                    },
                });
            }

            // Return existing client secret if intent is still valid
            if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(existingIntent.status)) {
                return res.status(200).json({
                    success: true,
                    clientSecret: existingIntent.client_secret,
                    paymentIntentId: existingIntent.id,
                    amount: order.totalAmount,
                });
            }
        }

        // Create new payment intent
        // Stripe expects amount in smallest currency unit (cents for USD, paise for INR)
        const currency = req.body.currency || 'inr';
        const amountInSmallestUnit = Math.round(order.totalAmount * 100);

        // Generate description for Indian export compliance
        // https://stripe.com/docs/india-exports
        const orderItems = order.orderItems || [];
        const itemDescriptions = orderItems
            .map((item: any) => `${item.productTitle} x${item.quantity}`)
            .slice(0, 5) // Limit to first 5 items
            .join(', ');

        const description = `Order #${order.id.slice(-8).toUpperCase()} - ${itemDescriptions}${orderItems.length > 5 ? ` (+${orderItems.length - 5} more)` : ''}`;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInSmallestUnit,
            currency: currency,
            // Required for Indian export regulations (RBI compliance)
            description: description,
            metadata: {
                orderId: order.id,
                userId: order.userId,
                itemCount: orderItems.length.toString(),
            },
            // Shipping details for export compliance
            shipping: order.shippingAddress ? {
                name: order.shippingAddress.fullName,
                address: {
                    line1: order.shippingAddress.addressLine1,
                    line2: order.shippingAddress.addressLine2 || undefined,
                    city: order.shippingAddress.city,
                    state: order.shippingAddress.state,
                    postal_code: order.shippingAddress.postalCode,
                    country: order.shippingAddress.country,
                },
                phone: order.shippingAddress.phoneNumber || undefined,
            } : undefined,
            automatic_payment_methods: {
                enabled: true,
            },
        });

        // Save payment intent ID to order
        order.paymentIntentId = paymentIntent.id;
        order.paymentStatus = PaymentStatus.PROCESSING;
        await order.save();

        res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: order.totalAmount,
        });
    } catch (error: any) {
        console.error('Payment intent creation failed:', error);
        return next(new BadRequestError(error.message || 'Failed to create payment intent'));
    }
};

/**
 * Confirm payment was successful (called after client-side confirmation)
 * POST /api/order/:orderId/confirm-payment
 */
export const confirmPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { orderId } = req.params;
        const { paymentIntentId } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return next(new BadRequestError('User authentication required'));
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return next(new NotFoundError('Order not found'));
        }

        if (order.userId !== userId) {
            return next(new BadRequestError('Not authorized to access this order'));
        }

        if (!paymentIntentId || order.paymentIntentId !== paymentIntentId) {
            return next(new BadRequestError('Invalid payment intent'));
        }

        // Verify payment intent status with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            order.paymentStatus = PaymentStatus.SUCCEEDED;
            order.orderStatus = OrderStatus.PAID;
            order.paidAt = new Date();
            await order.save();

            return res.status(200).json({
                success: true,
                message: 'Payment confirmed successfully',
                order: {
                    id: order.id,
                    orderStatus: order.orderStatus,
                    paymentStatus: order.paymentStatus,
                    paidAt: order.paidAt,
                },
            });
        }

        // Payment not successful
        const statusMap: Record<string, PaymentStatus> = {
            'requires_payment_method': PaymentStatus.FAILED,
            'requires_confirmation': PaymentStatus.PROCESSING,
            'requires_action': PaymentStatus.PROCESSING,
            'processing': PaymentStatus.PROCESSING,
            'canceled': PaymentStatus.CANCELLED,
        };

        order.paymentStatus = statusMap[paymentIntent.status] || PaymentStatus.PENDING;
        await order.save();

        return res.status(200).json({
            success: false,
            message: `Payment status: ${paymentIntent.status}`,
            order: {
                id: order.id,
                orderStatus: order.orderStatus,
                paymentStatus: order.paymentStatus,
            },
        });
    } catch (error: any) {
        console.error('Payment confirmation failed:', error);
        return next(new BadRequestError(error.message || 'Failed to confirm payment'));
    }
};

/**
 * Stripe Webhook Handler
 * POST /api/order/webhook
 */
export const stripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not configured');
        return res.status(500).json({ error: 'Webhook not configured' });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object;
            const orderId = paymentIntent.metadata.orderId;

            if (orderId) {
                const order = await Order.findById(orderId);
                if (order && order.paymentStatus !== PaymentStatus.SUCCEEDED) {
                    order.paymentStatus = PaymentStatus.SUCCEEDED;
                    order.orderStatus = OrderStatus.PAID;
                    order.paidAt = new Date();
                    await order.save();
                    console.log(`Order ${orderId} marked as paid via webhook`);
                }
            }
            break;
        }

        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object;
            const orderId = paymentIntent.metadata.orderId;

            if (orderId) {
                const order = await Order.findById(orderId);
                if (order) {
                    order.paymentStatus = PaymentStatus.FAILED;
                    order.orderStatus = OrderStatus.PAYMENT_FAILED;
                    await order.save();
                    console.log(`Order ${orderId} payment failed via webhook`);
                }
            }
            break;
        }

        case 'charge.refunded': {
            const charge = event.data.object;
            const paymentIntentId = charge.payment_intent as string;

            if (paymentIntentId) {
                const order = await Order.findOne({ paymentIntentId });
                if (order) {
                    order.paymentStatus = PaymentStatus.REFUNDED;
                    order.orderStatus = OrderStatus.REFUNDED;
                    await order.save();
                    console.log(`Order ${order.id} refunded via webhook`);
                }
            }
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
};

