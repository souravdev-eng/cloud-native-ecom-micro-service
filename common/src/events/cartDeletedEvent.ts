import { Subjects } from '../types/subjects';

export interface CartDeletedEvent {
  subject: Subjects.CartDeleted;
  data: {
    cartId: string;
    userId: string;
    version: number;
  };
}
