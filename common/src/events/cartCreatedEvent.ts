import { Subjects } from '../types/subjects';

export interface CartCreatedEvent {
  subject: Subjects.CartCreated;
  data: {
    cartId: string;
    userId: string;
    product: {
      id: string;
      title: string;
      price: number;
      image: string;
      sellerId: string;
      quantity: number;
    };
    cartQuantity: number;
    total: number;
    version: number;
  };
}
