import { useEffect, useState } from 'react';
import { productApi } from '../../api/baseUrl';

export interface HomeProduct {
    id: string;
    title: string;
    price: number;
    image: string;
    tags: string[];
    rating: number;
    category: string;
}

export const useHomePage = () => {
    const [featured, setFeatured] = useState<HomeProduct[]>([]);
    const [newArrivals, setNewArrivals] = useState<HomeProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fields = 'title,image,price,tags,rating,category';

        Promise.all([
            productApi.get(`/?fields=${fields}&limit=6&sort=-rating`),
            productApi.get(`/?fields=${fields}&limit=4&sort=-_id`),
        ])
            .then(([featuredRes, newRes]) => {
                setFeatured(featuredRes?.data?.data ?? []);
                setNewArrivals(newRes?.data?.data ?? []);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    return { featured, newArrivals, isLoading };
};
