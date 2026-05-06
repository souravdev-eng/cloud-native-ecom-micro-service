import express from 'express';
import axios from 'axios';
import { initTracing, createSpan, addSpanAttributes, addSpanEvent } from '../../../shared/tracing';

// Initialize tracing
initTracing('order-service');

const app = express();
const port = 3001;

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'order-service' });
});

app.post('/orders', async (req, res) => {
    const { userId, items, paymentMethod } = req.body;
    const orderId = `ORD-${Date.now()}`;

    try {
        addSpanAttributes({
            'order.id': orderId,
            'order.user.id': userId,
            'order.items.count': items.length,
        });

        // Step 1: Check inventory
        const inventoryResult = await createSpan('check-inventory', async () => {
            addSpanEvent('Checking inventory availability');

            const response = await axios.post(
                `${process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002'}/inventory/check`,
                { items }
            );

            addSpanEvent('Inventory check completed', {
                available: response.data.available,
            });

            return response.data;
        });

        if (!inventoryResult.available) {
            throw new Error('Some items are out of stock');
        }

        // Step 2: Process payment
        const paymentResult = await createSpan('process-payment', async () => {
            addSpanEvent('Processing payment');

            const totalAmount = items.reduce((sum: number, item: any) => sum + item.price, 0);

            const response = await axios.post(
                `${process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003'}/payments`,
                {
                    orderId,
                    userId,
                    amount: totalAmount,
                    method: paymentMethod,
                }
            );

            addSpanEvent('Payment processed', {
                transactionId: response.data.transactionId,
                status: response.data.status,
            });

            return response.data;
        });

        // Step 3: Create order in database (simulated)
        await createSpan('save-order-to-database', async () => {
            // Simulate database operation
            await new Promise(resolve => setTimeout(resolve, 50));

            addSpanEvent('Order saved to database', {
                orderId,
                timestamp: new Date().toISOString(),
            });
        });

        res.json({
            orderId,
            status: 'confirmed',
            paymentId: paymentResult.transactionId,
            message: 'Order created successfully',
        });
    } catch (error: any) {
        addSpanEvent('Order creation failed', {
            error: error.message,
            orderId,
        });

        res.status(500).json({
            error: error.message,
            orderId,
        });
    }
});

app.listen(port, () => {
    console.log(`Order Service running on http://localhost:${port}`);
});
