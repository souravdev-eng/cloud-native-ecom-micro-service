import express from 'express';
import { initTracing, createSpan, addSpanAttributes, addSpanEvent } from '../../../shared/tracing';

// Initialize tracing
initTracing('inventory-service');

const app = express();
const port = 3002;

app.use(express.json());

// Simulated inventory database
const inventory: Record<string, number> = {
  'ITEM-001': 100,
  'ITEM-002': 50,
  'ITEM-003': 0, // Out of stock
  'ITEM-004': 25,
};

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'inventory-service' });
});

app.post('/inventory/check', async (req, res) => {
  const { items } = req.body;

  await createSpan('inventory-check-operation', async () => {
    addSpanAttributes({
      'inventory.items.requested': items.length,
    });

    // Simulate database query
    await createSpan('database-query', async () => {
      await new Promise(resolve => setTimeout(resolve, 30));
      addSpanEvent('Database query completed');
    });

    const unavailableItems: string[] = [];
    
    for (const item of items) {
      const itemId = item.id || `ITEM-00${Math.floor(Math.random() * 4) + 1}`;
      const stock = inventory[itemId] || 0;
      
      addSpanEvent('Checking item availability', {
        itemId,
        requestedQuantity: item.quantity || 1,
        availableStock: stock,
      });

      if (stock < (item.quantity || 1)) {
        unavailableItems.push(itemId);
      }
    }

    const available = unavailableItems.length === 0;
    
    addSpanAttributes({
      'inventory.check.result': available,
      'inventory.unavailable.count': unavailableItems.length,
    });

    res.json({
      available,
      unavailableItems,
      message: available ? 'All items available' : 'Some items out of stock',
    });
  });
});

app.post('/inventory/reserve', async (req, res) => {
  const { items, orderId } = req.body;

  await createSpan('inventory-reserve-operation', async () => {
    addSpanAttributes({
      'inventory.order.id': orderId,
      'inventory.items.count': items.length,
    });

    // Simulate reservation logic
    await new Promise(resolve => setTimeout(resolve, 40));
    
    addSpanEvent('Items reserved', {
      orderId,
      itemCount: items.length,
    });

    res.json({
      reserved: true,
      orderId,
      message: 'Items reserved successfully',
    });
  });
});

app.listen(port, () => {
  console.log(`Inventory Service running on http://localhost:${port}`);
});
