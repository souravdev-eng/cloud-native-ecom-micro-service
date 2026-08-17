import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { cartApi, productApi } from '../../api/baseUrl';
import { notifyCartUpdated } from '../../hooks/useCartCount';
import { isUnauthorized, parseErrorMessage } from '../../utils/parseError';

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

export type CartFeedback = { type: 'success' | 'error'; message: string } | null;

export const useProductDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [product, setProduct] = useState<IProductDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [requiresAuth, setRequiresAuth] = useState(false);
    const [qty, setQty] = useState(1);

    const [addingToCart, setAddingToCart] = useState(false);
    const [feedback, setFeedback] = useState<CartFeedback>(null);

    useEffect(() => {
        setIsLoading(true);
        setLoadError(null);
        setRequiresAuth(false);

        productApi
            .get(`/${id}`)
            .then((res) => {
                setProduct(res?.data);
            })
            .catch((err) => {
                // Every product route sits behind requireAuth, so an anonymous
                // visitor gets a 401 here — that's "sign in", not "broken".
                setRequiresAuth(isUnauthorized(err));
                setLoadError(parseErrorMessage(err, 'Could not load this product'));
            })
            .finally(() => setIsLoading(false));
    }, [id]);

    // Clear the toast on its own so it doesn't sit there for the whole session.
    useEffect(() => {
        if (!feedback) return;
        const timer = setTimeout(() => setFeedback(null), 5000);
        return () => clearTimeout(timer);
    }, [feedback]);

    const incrementQty = () =>
        setQty((prev) => (product ? Math.min(prev + 1, product.quantity) : prev));

    const decrementQty = () => setQty((prev) => Math.max(prev - 1, 1));

    const handleAddToCart = async () => {
        if (!id || addingToCart) return;

        setAddingToCart(true);
        setFeedback(null);
        try {
            await cartApi.post('/', { productId: id, quantity: qty });
            // Tells the header badge to refetch — the cart lives in another
            // service, so there is no shared store to update.
            notifyCartUpdated();
            setFeedback({
                type: 'success',
                message: `Added ${qty} × ${product?.title ?? 'item'} to your cart.`,
            });
        } catch (err) {
            if (isUnauthorized(err)) {
                // Come back here after signing in rather than dumping them on
                // the home page and losing the product they were looking at.
                navigate(`/user/auth/signin?next=${encodeURIComponent(`/product/${id}`)}`);
                return;
            }
            setFeedback({
                type: 'error',
                message: parseErrorMessage(err, 'Could not add this item to your cart'),
            });
        } finally {
            setAddingToCart(false);
        }
    };

    return {
        product,
        isLoading,
        loadError,
        requiresAuth,
        qty,
        incrementQty,
        decrementQty,
        handleAddToCart,
        addingToCart,
        feedback,
        dismissFeedback: () => setFeedback(null),
    };
};
