import { ExchangeTypes } from './exchange.types';
import { RoutingKeyTypes } from './routingKey.types';
export interface ProductCreatedMessage {
    exchangeName: ExchangeTypes.ProductService;
    routingKey: RoutingKeyTypes.ProductCreated;
    data: {
        id: string;
        title: string;
        quantity: number;
        price: number;
        sellerId: string;
    };
}
export interface ProductUpdatedMessage {
    exchangeName: ExchangeTypes.ProductService;
    routingKey: RoutingKeyTypes.ProductUpdated;
    data: {
        id: string;
        title: string;
        quantity: number;
        price: number;
        sellerId: string;
    };
}
export interface ProductDeletedMessage {
    exchangeName: ExchangeTypes.ProductService;
    routingKey: RoutingKeyTypes.ProductDeleted;
    data: {
        id: string;
    };
}
