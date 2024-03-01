import { Subjects } from '../types/subjects';

export interface SellerUpdatedEvent {
  subject: Subjects.SellerUpdated;
  data: {
    id: string;
    email: string;
    role: string;
  };
}
