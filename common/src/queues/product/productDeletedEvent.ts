import { Subjects } from '../../types/subjects';

export interface ProductDeletedEvent {
  subject: Subjects.ProductDeleted;
  data: { id: string };
}
