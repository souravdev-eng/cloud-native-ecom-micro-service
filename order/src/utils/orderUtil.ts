import { CartDocument } from '../models/cart';
import { OrderItem } from '../types/order.type';

// Helper function to reserve inventory
async function reserveInventory(orderItems: OrderItem[], orderId: string): Promise<void> {
  try {
    // TODO: In a proper event-driven architecture, this should publish an
    // InventoryReservationRequestedEvent instead of making HTTP calls
    // For now, we'll simulate successful reservation

    console.log(`Inventory reservation requested for order: ${orderId}`);
    console.log(
      'Reservation details:',
      orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        productTitle: item.productTitle,
      }))
    );

    // Simulate successful reservation
    // In real implementation, this would:
    // 1. Publish InventoryReservationRequestedEvent
    // 2. Product service would listen and respond with InventoryReservedEvent or InventoryReservationFailedEvent
    // 3. Order service would listen to those events and update order status accordingly

    return Promise.resolve();
  } catch (error) {
    console.error('Inventory reservation error:', error);
    throw error;
  }
}

function validateProductAvailability(cartData: CartDocument[]): void {
  for (const cart of cartData) {
    if (cart.cartQuantity > cart.productQuantity) {
      throw new Error(
        `Insufficient stock for ${cart.productTitle}. Available: ${cart.productQuantity}, Requested: ${cart.cartQuantity}`
      );
    }

    if (cart.productQuantity <= 0) {
      throw new Error(`${cart.productTitle} is out of stock`);
    }
  }
}

// Helper function to calculate tax (8.5% for example)
function calculateTax(subtotal: number): number {
  const TAX_RATE = 0.085; // 8.5%
  return Math.round(subtotal * TAX_RATE * 100) / 100;
}

// Helper function to calculate shipping
function calculateShipping(subtotal: number): number {
  // Free shipping over $100, otherwise $10
  if (subtotal >= 100) {
    return 0;
  }
  return 10;
}

export { reserveInventory, calculateTax, calculateShipping, validateProductAvailability };
