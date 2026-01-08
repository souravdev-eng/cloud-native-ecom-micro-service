import express from 'express';
import axios from 'axios';
import { initTracing, createSpan, addSpanAttributes, addSpanEvent } from '../../../shared/tracing';

// Initialize tracing BEFORE importing other modules
initTracing('api-gateway');

const app = express();
const port = 3000;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'api-gateway' });
});

// Main checkout endpoint that orchestrates multiple services
app.post('/checkout', async (req, res) => {
    const { userId, items, paymentMethod } = req.body;

    try {
        // Add attributes to the automatically created span
        addSpanAttributes({
            'user.id': userId,
            'checkout.items.count': items.length,
            'checkout.payment.method': paymentMethod,
        });

        addSpanEvent('Checkout started', {
            userId,
            itemCount: items.length,
        });

        // Call order service
        const orderResponse = await createSpan('call-order-service', async () => {
            const response = await axios.post(
                `${process.env.ORDER_SERVICE_URL || 'http://localhost:3001'}/orders`,
                {
                    userId,
                    items,
                    paymentMethod,
                }
            );
            return response.data;
        });

        addSpanEvent('Checkout completed', {
            orderId: orderResponse.orderId,
            success: true,
        });

        res.json({
            success: true,
            orderId: orderResponse.orderId,
            message: 'Checkout completed successfully',
        });
    } catch (error: any) {
        addSpanEvent('Checkout failed', {
            error: error.message,
        });

        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

app.listen(port, () => {
    console.log(`API Gateway running on http://localhost:${port}`);
    console.log('Tracing enabled - check Jaeger UI at http://localhost:16686');
});
