import { Subjects, Publisher, ProductDeletedEvent } from '@ecom-micro/common';

export class ProductDeletedPublisher extends Publisher<ProductDeletedEvent> {
  subject: Subjects.ProductDeleted = Subjects.ProductDeleted;
}
