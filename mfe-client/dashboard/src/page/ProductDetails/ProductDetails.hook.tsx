import { useEffect, useState } from 'react';
import { cartApi, productApi } from '../../api/baseUrl';
import { useParams } from 'react-router-dom';

export interface IProductDetails {
    id: string;
    title: string;
    price: number;
    image: string;
    description: string;
    rating: number;
    category: string;
    tags: string[];
    quantity: number;
}

export const useProductDetails = () => {
    const [product, setProduct] = useState<IProductDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [qty, setQty] = useState(1);
    const { id } = useParams();

    useEffect(() => {
        setIsLoading(true);
        productApi
            .get(`/${id}`)
            .then((res) => {
                setProduct(res?.data);
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => setIsLoading(false));
    }, [id]);

    const incrementQty = () =>
        setQty((prev) => (product ? Math.min(prev + 1, product.quantity) : prev));

    const decrementQty = () => setQty((prev) => Math.max(prev - 1, 1));

    const handleAddToCart = async () => {
        try {
            const res = await cartApi.post(`/`, { productId: id, quantity: qty });
            if (res) {
                console.log('Product added to cart', res);
            }
        } catch (err: any) {
            console.error('Error adding to cart', err);
        }
    };

    return { product, isLoading, qty, incrementQty, decrementQty, handleAddToCart };
};
