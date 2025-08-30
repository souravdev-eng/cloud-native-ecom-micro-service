import { ExchangeTypes } from '../../types/exchange.types';

export interface CartDeletedMessage {
  exchangeName: ExchangeTypes.CartService;
  data: {
    cartId: string;
    userId: string;
    version: number;
  };
}
