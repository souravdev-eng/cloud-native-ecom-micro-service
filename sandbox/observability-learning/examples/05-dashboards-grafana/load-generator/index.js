const axios = require('axios');

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000';
const REQUESTS_PER_SECOND = parseInt(process.env.REQUESTS_PER_SECOND) || 10;

// Simulate different user behaviors
const scenarios = [
  // Happy path - successful order
  async () => {
    const userId = `user-${Math.floor(Math.random() * 1000)}`;
    
    // Add to cart
    await axios.post(`${TARGET_URL}/cart/${userId}/items`, {
      items: [
        { id: 'ITEM-001', price: 29.99, quantity: Math.ceil(Math.random() * 3) },
        { id: 'ITEM-002', price: 49.99, quantity: 1 }
      ]
    }).catch(() => {});
    
    // Check inventory
    await axios.get(`${TARGET_URL}/inventory/ITEM-001`).catch(() => {});
    
    // Create order
    await axios.post(`${TARGET_URL}/orders`, {
      items: [
        { id: 'ITEM-001', price: 29.99, quantity: 1 }
      ],
      paymentMethod: Math.random() > 0.5 ? 'credit_card' : 'paypal',
      userId
    }).catch(() => {});
    
    // Process payment
    await axios.post(`${TARGET_URL}/payments`, {
      amount: 29.99,
      method: 'credit_card',
      orderId: `ORD-${Date.now()}`
    }).catch(() => {});
  },
  
  // Cart abandonment
  async () => {
    const userId = `user-${Math.floor(Math.random() * 1000)}`;
    
    await axios.post(`${TARGET_URL}/cart/${userId}/items`, {
      items: [
        { id: 'ITEM-003', price: 99.99, quantity: 1 }
      ]
    }).catch(() => {});
    
    // Abandon cart
    await axios.delete(`${TARGET_URL}/cart/${userId}?reason=price_too_high`).catch(() => {});
  },
  
  // Browse inventory
  async () => {
    for (let i = 1; i <= 3; i++) {
      await axios.get(`${TARGET_URL}/inventory/ITEM-00${i}`).catch(() => {});
    }
  },
  
  // Check analytics
  async () => {
    await axios.get(`${TARGET_URL}/analytics/conversion`).catch(() => {});
    await axios.get(`${TARGET_URL}/queue/status`).catch(() => {});
  },
  
  // Failed payment
  async () => {
    await axios.post(`${TARGET_URL}/payments`, {
      amount: 999.99,
      method: 'invalid',
      orderId: `ORD-${Date.now()}`
    }).catch(() => {});
  }
];

// Generate load
async function generateLoad() {
  console.log(`🚀 Load Generator Started`);
  console.log(`Target: ${TARGET_URL}`);
  console.log(`Rate: ${REQUESTS_PER_SECOND} requests/second`);
  
  setInterval(() => {
    // Pick a random scenario
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    scenario().catch(err => {
      // Errors are expected in some scenarios
    });
  }, 1000 / REQUESTS_PER_SECOND);
  
  // Log stats every 10 seconds
  let requestCount = 0;
  setInterval(() => {
    requestCount += REQUESTS_PER_SECOND * 10;
    console.log(`📊 Generated ${requestCount} requests so far...`);
  }, 10000);
}

// Wait for services to be ready
setTimeout(() => {
  generateLoad();
}, 5000);

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down load generator...');
  process.exit(0);
});
