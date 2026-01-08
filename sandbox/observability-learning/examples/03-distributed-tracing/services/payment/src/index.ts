import express from 'express';
import { initTracing, createSpan, addSpanAttributes, addSpanEvent } from '../../../shared/tracing';

// Initialize tracing
initTracing('payment-service');

const app = express();
const port = 3003;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'payment-service' });
});

app.post('/payments', async (req, res) => {
  const { orderId, userId, amount, method } = req.body;
  const transactionId = `TXN-${Date.now()}`;

  await createSpan('payment-processing', async () => {
    addSpanAttributes({
      'payment.transaction.id': transactionId,
      'payment.order.id': orderId,
      'payment.user.id': userId,
      'payment.amount': amount,
      'payment.method': method,
      'payment.currency': 'USD',
    });

    try {
      // Step 1: Validate payment method
      await createSpan('validate-payment-method', async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        
        if (method === 'invalid') {
          throw new Error('Invalid payment method');
        }
        
        addSpanEvent('Payment method validated', { method });
      });

      // Step 2: Check for fraud (simulated)
      await createSpan('fraud-check', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const fraudScore = Math.random();
        addSpanAttributes({
          'payment.fraud.score': fraudScore,
          'payment.fraud.passed': fraudScore < 0.8,
        });
        
        if (fraudScore > 0.8) {
          throw new Error('Payment flagged as potentially fraudulent');
        }
        
        addSpanEvent('Fraud check passed', { score: fraudScore });
      });

      // Step 3: Process with payment gateway (simulated)
      await createSpan('payment-gateway-call', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Simulate occasional payment failures
        if (Math.random() > 0.9) {
          throw new Error('Payment gateway timeout');
        }
        
        addSpanEvent('Payment gateway processed', {
          gateway: 'stripe',
          responseTime: 100,
        });
      });

      // Step 4: Record transaction
      await createSpan('record-transaction', async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        
        addSpanEvent('Transaction recorded', {
          transactionId,
          timestamp: new Date().toISOString(),
        });
      });

      res.json({
        transactionId,
        status: 'completed',
        amount,
        currency: 'USD',
        message: 'Payment processed successfully',
      });
    } catch (error: any) {
      addSpanEvent('Payment failed', {
        error: error.message,
        transactionId,
      });

      res.status(400).json({
        transactionId,
        status: 'failed',
        error: error.message,
      });
    }
  });
});

app.listen(port, () => {
  console.log(`Payment Service running on http://localhost:${port}`);
});
