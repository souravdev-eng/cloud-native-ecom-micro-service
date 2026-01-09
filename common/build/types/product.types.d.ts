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
        image: string;
        sellerId: string;
        originalPrice: number;
        stockQuantity: number;
        tags: string[];
        category: string;
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
        image: string;
        sellerId: string;
        originalPrice: number;
        stockQuantity: number;
        tags: string[];
        category: string;
    };
}
export interface ProductDeletedMessage {
    exchangeName: ExchangeTypes.ProductService;
    routingKey: RoutingKeyTypes.ProductDeleted;
    data: {
        id: string;
    };
}
export interface ProductQuantityUpdatedMessage {
    exchangeName: ExchangeTypes.ProductService;
    routingKey: RoutingKeyTypes.ProductQuantityUpdated;
    data: {
        id: string;
        quantity: number;
        sellerId: string;
    };
}
