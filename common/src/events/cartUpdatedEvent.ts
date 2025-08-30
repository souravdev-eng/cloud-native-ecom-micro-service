import { Subjects } from '../types/subjects';

export interface CartUpdatedEvent {
  subject: Subjects.CartUpdated;
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
