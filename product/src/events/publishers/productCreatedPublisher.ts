import { Subjects, ProductCreatedEvent, Publisher } from '@ecom-micro/common';

export class ProductCreatedPublisher extends Publisher<ProductCreatedEvent> {
  subject: Subjects.ProductCreated = Subjects.ProductCreated;
}
