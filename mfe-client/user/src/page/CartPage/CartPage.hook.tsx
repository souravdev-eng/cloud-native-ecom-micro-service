import { useState, useEffect, useCallback } from 'react';
import { cartApi } from '../../api/baseUrl';

interface CartItem {
    product_id: string;
    cart_id: string;
    title: string;
    image: string;
    price: number;
    quantity: number;
    total: number;
}

interface CartState {
    items: CartItem[];
    total: number;
    loading: boolean;
    error: string | null;
}

// Helper function to parse error response
// Handles: { errors: [{ message: "..." }] } format
const parseErrorMessage = (err: any): string => {
    // Handle { errors: [{ message: "..." }] } format
    if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const messages = err.response.data.errors
            .map((e: any) => e.message)
            .filter(Boolean);
        if (messages.length > 0) {
            return messages.join('. ');
        }
    }
    // Handle { message: "..." } format
    if (err.response?.data?.message) {
        return err.response.data.message;
    }
    // Handle { error: "..." } format
    if (err.response?.data?.error) {
        return err.response.data.error;
    }
    // Default fallback
    return 'Something went wrong. Please try again.';
};

export const useCart = () => {
    const [cartState, setCartState] = useState<CartState>({
        items: [],
        total: 0,
        loading: true,
        error: null,
    });
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const clearActionError = useCallback(() => {
        setActionError(null);
    }, []);

    const fetchCart = useCallback(async () => {
        try {
            setCartState((prev) => ({ ...prev, loading: true, error: null }));
            const response = await cartApi.get("/");
            setCartState({
                items: response.data.carts || [],
                total: response.data.total || 0,
                loading: false,
                error: null,
            });
        } catch (err: any) {
            setCartState((prev) => ({
                ...prev,
                loading: false,
                error: parseErrorMessage(err),
            }));
        }
    }, []);

    const removeItem = async (cartId: string) => {
        try {
            setRemovingId(cartId);
            setActionError(null);
            await cartApi.delete(`/${cartId}`);
            await fetchCart();
        } catch (err: any) {
            setActionError(parseErrorMessage(err));
        } finally {
            setRemovingId(null);
        }
    };

    const updateQuantity = async (productId: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        try {
            setUpdatingId(productId);
            setActionError(null);
            await cartApi.post("/", { productId, quantity: newQuantity });
            await fetchCart();
        } catch (err: any) {
            setActionError(parseErrorMessage(err));
        } finally {
            setUpdatingId(null);
        }
    };

    // Auto-dismiss action error after 5 seconds
    useEffect(() => {
        if (actionError) {
            const timer = setTimeout(() => {
                setActionError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [actionError]);

    useEffect(() => {
        fetchCart();
    }, []);

    const itemCount = cartState.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartState.total;
    const shipping = subtotal > 100 ? 0 : 9.99;
    const tax = subtotal * 0.08;
    const grandTotal = subtotal + shipping + tax;

    return {
        ...cartState,
        itemCount,
        subtotal,
        shipping,
        tax,
        grandTotal,
        removingId,
        updatingId,
        actionError,
        clearActionError,
        removeItem,
        updateQuantity,
        refetch: fetchCart,
    };
};
