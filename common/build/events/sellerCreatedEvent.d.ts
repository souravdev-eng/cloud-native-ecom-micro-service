import { Subjects } from '../types/subjects';
export interface SellerCreatedEvent {
    subject: Subjects.SellerCreated;
    data: {
        id: string;
        email: string;
        role: string;
    };
}
