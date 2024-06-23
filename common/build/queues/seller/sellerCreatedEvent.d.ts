import { Exchange } from '../types/Exchange';
export interface SellerCreatedEvent {
    subject: Exchange.SellerCreated;
    data: {
        id: string;
        email: string;
        role: string;
    };
}
