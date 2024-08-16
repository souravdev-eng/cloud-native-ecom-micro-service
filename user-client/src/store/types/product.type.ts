export interface Product {
    quantity: number;
    title: string;
    image: string;
    category: string;
    description: string;
    price: number;
    rating: number;
    sellerId: string;
    tags: string[] | string;
    id: string;
}

export interface CustomError {
    message: string;
    field?: string;
}
