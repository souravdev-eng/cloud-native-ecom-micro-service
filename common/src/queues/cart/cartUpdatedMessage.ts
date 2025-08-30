import { ExchangeTypes } from '../../types/exchange.types';

export interface CartUpdatedMessage {
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
    cartQuantity: number; // Updated quantity in cart
    total: number;
    version: number;
  };
}
