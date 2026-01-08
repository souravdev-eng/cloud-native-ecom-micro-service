import express from 'express';
import { correlationIdMiddleware } from './middleware';
import { logger } from './logger';
import axios from 'axios';

const app = express();
const port = 4000;

app.use(correlationIdMiddleware);

app.get('/', (req, res) => {
    logger.info('Handling request on root path');
    res.json({ message: 'Hello with Correlation ID!' });
});

app.get('/order', async (req, res) => {
    logger.info('Creating a new order...');

    // Simulate a call to another service (e.g., Payment Service)
    try {
        logger.info('Calling payment service...');
        // In a real scenario, you'd pass the correlation ID to the next service
        // const response = await axios.get('http://payment-service:4001', {
        //   headers: { 'x-correlation-id': req.headers['x-correlation-id'] }
        // });

        // For this example, we'll just simulate a delay
        await new Promise(resolve => setTimeout(resolve, 500));

        logger.info('Payment processed successfully');
        res.json({ orderId: 'ORD-123', status: 'success' });
    } catch (error) {
        logger.error('Order creation failed', { error });
        res.status(500).json({ error: 'Failed to create order' });
    }
});

app.listen(port, () => {
    console.log(`[Correlation ID Sandbox] Service running at http://localhost:${port}`);
    console.log(`Try: curl -H "x-correlation-id: my-custom-id" http://localhost:${port}/order`);
});

