import { Subjects, ProductUpdatedEvent, Publisher } from '@ecom-micro/common';

export class ProductUpdatedPublisher extends Publisher<ProductUpdatedEvent> {
  subject: Subjects.ProductUpdated = Subjects.ProductUpdated;
}
