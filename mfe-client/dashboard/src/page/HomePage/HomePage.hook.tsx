import { useEffect, useState } from 'react';
import { productApi } from '../../api/baseUrl';
import { isUnauthorized, parseErrorMessage } from '../../utils/parseError';

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
    const [error, setError] = useState<string | null>(null);
    // Every product route sits behind requireAuth, so an anonymous visitor gets
    // a 401 for the whole catalogue. Tracked separately: it needs a "sign in"
    // prompt, not an error.
    const [requiresAuth, setRequiresAuth] = useState(false);

    useEffect(() => {
        const fields = 'title,image,price,tags,rating,category';

        Promise.all([
            productApi.get(`/?fields=${fields}&limit=6&sort=-rating`),
            productApi.get(`/?fields=${fields}&limit=4&sort=-_id`),
        ])
            .then(([featuredRes, newRes]) => {
                setFeatured(featuredRes?.data?.data ?? []);
                setNewArrivals(newRes?.data?.data ?? []);
                setError(null);
                setRequiresAuth(false);
            })
            .catch((err) => {
                // Previously `.catch(console.error)`, which rendered an empty
                // storefront with no hint as to why.
                setRequiresAuth(isUnauthorized(err));
                setError(parseErrorMessage(err, 'Could not load products'));
            })
            .finally(() => setIsLoading(false));
    }, []);

    return { featured, newArrivals, isLoading, error, requiresAuth };
};
