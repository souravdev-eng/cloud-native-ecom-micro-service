import { Request, Response, NextFunction } from 'express';
import { NotFoundError, BadRequestError } from '@ecom-micro/common';
import { Order } from '../models/orderModel';

export const getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next(new BadRequestError('User authentication required'));
    }

    const orders = await Order.find({ userId });

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders,
    });
  } catch (error: any) {
    console.error('Failed to get user orders:', error);
    return next(new BadRequestError('Failed to retrieve orders'));
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return next(new BadRequestError('User authentication required'));
    }

    if (!orderId) {
      return next(new BadRequestError('Order ID is required'));
    }

    const order = await Order.findOne({ _id: orderId, userId }).lean();

    if (!order) {
      return next(new NotFoundError('Order not found'));
    }

    res.status(200).json({
      success: true,
      message: 'Order retrieved successfully',
      order,
    });
  } catch (error: any) {
    console.error('Failed to get order by ID:', error);
    return next(new BadRequestError('Failed to retrieve order'));
  }
};
