import { Exchange } from '../queues/types/Exchange';

export interface ProductCreatedMessage {
  exchange: Exchange.ProductCreated;
  data: {
    id: string;
    title: string;
    quantity: number;
    price: number;
    sellerId: string;
  };
}

export interface ProductUpdatedMessage {
  exchange: Exchange.ProductUpdated;
  data: {
    id: string;
    title: string;
    quantity: number;
    price: number;
    sellerId: string;
  };
}

export interface ProductDeletedMessage {
  exchange: Exchange.ProductDeleted;
  data: {
    id: string;
  };
}
