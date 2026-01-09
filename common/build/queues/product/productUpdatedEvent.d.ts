import { Exchange } from '../types/Exchange';
export interface ProductUpdatedEvent {
    subject: Exchange.ProductUpdated;
    data: {
        id: string;
        title: string;
        price: number;
        image: string;
        sellerId: string;
        category: string;
        originalPrice: number;
        stockQuantity: number;
        tags: string[];
    };
}
