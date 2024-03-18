import { Subjects } from '../types/subjects';

export interface ProductCreatedEvent {
  subject: Subjects.ProductCreated;
  data: {
    id: string;
    title: string;
    price: number;
    image: string;
    sellerId: string;
  };
}
