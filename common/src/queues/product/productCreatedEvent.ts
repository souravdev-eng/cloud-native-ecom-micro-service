import { Exchange } from '../types/Exchange';

export interface ProductCreatedEvent {
  subject: Exchange.ProductCreated;
  data: {
    id: string;
    title: string;
    price: number;
    image: string;
    sellerId: string;
  };
}
