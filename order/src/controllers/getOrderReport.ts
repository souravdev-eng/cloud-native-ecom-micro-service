import { Request, Response, NextFunction } from 'express'
import { Order } from '../models/orderModel';


export const getOrdersSummery = async (req: Request, res: Response, next: NextFunction) => {
    const sellerId = req.user?.id;

    const order = await Order.aggregate([
        {
            $match: { "orderItems.sellerId": sellerId },
        },
        {
            $unwind: "$orderItems"
        },
        {
            $match: { "orderItems.sellerId": sellerId },
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$orderItems.subtotal" },
                totalOrders: { $sum: 1 },
                totalProductSell: { $sum: "$orderItems.quantity" },
                totalCustomersArray: { $addToSet: "$userId" }
            },
        },
        {
            $project: {
                _id: 0,
                totalRevenue: 1,
                totalOrders: 1,
                totalProductSell: 1,
                totalCustomers: { $size: "$totalCustomersArray" }
            }
        }
    ])

    res.send(order)
}

export const getRecentOrders = async (req: Request, res: Response, next: NextFunction) => {
    const sellerId = req.user?.id;

};

export const getOrdersByStatus = async (req: Request, res: Response, next: NextFunction) => {
    const sellerId = req.user?.id;

    const orders = await Order.aggregate([
        {
            $match: { "orderItems.sellerId": sellerId }
        },
        {
            $unwind: "$orderItems"
        },
        {
            $match: { "orderItems.sellerId": sellerId }
        },
        {
            $group: {
                _id: "$orderStatus",
                count: { $sum: 1 },
            }
        }, {
            $project: {
                _id: 0,
                status: "$_id",
                count: 1
            }
        }
    ])

    res.send(orders)
};

export const getOrdersTrends = async (req: Request, res: Response, next: NextFunction) => { };