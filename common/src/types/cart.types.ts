import { ExchangeTypes } from './exchange.types';
import { RoutingKeyTypes } from './routingKey.types';

export interface CartCreatedMessage {
  exchangeName: ExchangeTypes.CartService;
  routingKey: RoutingKeyTypes.CartCreated;
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

export interface CartUpdatedMessage {
  exchangeName: ExchangeTypes.CartService;
  routingKey: RoutingKeyTypes.CartUpdated;
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

export interface CartDeletedMessage {
  exchangeName: ExchangeTypes.CartService;
  routingKey: RoutingKeyTypes.CartDeleted;
  data: {
    cartId: string;
    userId: string;
    version: number;
  };
}
