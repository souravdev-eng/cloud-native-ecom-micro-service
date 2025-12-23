import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CART_API = 'http://localhost:4200';

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

export const useCart = () => {
    const [cartState, setCartState] = useState<CartState>({
        items: [],
        total: 0,
        loading: true,
        error: null,
    });
    const [removingId, setRemovingId] = useState<string | null>(null);

    const fetchCart = useCallback(async () => {
        try {
            setCartState((prev) => ({ ...prev, loading: true, error: null }));
            const response = await axios.get(`${CART_API}/api/cart`, {
                withCredentials: true,
            });
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
                error: err.response?.data?.message || 'Failed to fetch cart',
            }));
        }
    }, []);

    const removeItem = async (cartId: string) => {
        try {
            setRemovingId(cartId);
            await axios.delete(`${CART_API}/api/cart/${cartId}`, {
                withCredentials: true,
            });
            // Update local state optimistically
            setCartState((prev) => {
                const updatedItems = prev.items.filter((item) => item.cart_id !== cartId);
                const updatedTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
                return {
                    ...prev,
                    items: updatedItems,
                    total: updatedTotal,
                };
            });
        } catch (err: any) {
            // Refetch cart on error to sync state
            await fetchCart();
        } finally {
            setRemovingId(null);
        }
    };

    const updateQuantity = async (cartId: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        // Optimistic update
        setCartState((prev) => {
            const updatedItems = prev.items.map((item) => {
                if (item.cart_id === cartId) {
                    const updatedItem = {
                        ...item,
                        quantity: newQuantity,
                        total: item.price * newQuantity,
                    };
                    return updatedItem;
                }
                return item;
            });
            const updatedTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
            return {
                ...prev,
                items: updatedItems,
                total: updatedTotal,
            };
        });

        // TODO: Call API to update quantity when endpoint is available
        // try {
        //   await axios.patch(`${CART_API}/api/cart/${cartId}`, { quantity: newQuantity }, { withCredentials: true });
        // } catch (err) {
        //   await fetchCart();
        // }
    };

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

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
        removeItem,
        updateQuantity,
        refetch: fetchCart,
    };
};

