import { Publisher, Subjects, SellerCreatedEvent } from '@ecom-micro/common';

export class SellerCreatedPublisher extends Publisher<SellerCreatedEvent> {
  subject: Subjects.SellerCreated = Subjects.SellerCreated;
}
