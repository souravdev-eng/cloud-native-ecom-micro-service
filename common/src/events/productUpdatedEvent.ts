import { Subjects } from '../types/subjects';

export interface ProductUpdatedEvent {
  subject: Subjects.ProductUpdated;
  data: {
    id: string;
    title: string;
    price: number;
    image: string;
    sellerId: string;
  };
}
