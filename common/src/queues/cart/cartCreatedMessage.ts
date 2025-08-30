import { ExchangeTypes } from '../../types/exchange.types';

export interface CartCreatedMessage {
  exchangeName: ExchangeTypes.CartService;
  data: {
    cartId: string;
    userId: string;
    product: {
      id: string;
      title: string;
      price: number;
      image: string;
      sellerId: string;
      quantity: number; // Available product quantity
    };
    cartQuantity: number; // Quantity added to cart
    total: number;
    version: number;
  };
}
