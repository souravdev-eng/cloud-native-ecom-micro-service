import { useState, useEffect } from 'react';
import axios from 'axios';
import { baseUrl } from '../../api/baseUrl';

export interface Product {
    id: string;
    title: string;
    price: number;
    image: string;
    category?: string;
}

export interface CartItem {
    id: string;
    image: string;
    title: string;
    price: number;
    category?: string;
    quantity: number;
    product_id: string;
}



export const useCart = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (err) {
                console.error('Error loading cart from localStorage:', err);
                localStorage.removeItem('cart');
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    useEffect(() => {
        refreshCart();
    }, []);

    const refreshCart = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`${baseUrl}/cart`, {
                withCredentials: true,
            });
            console.log(response.data, 'response');

            if (response.data && Array.isArray(response.data?.carts)) {
                setCartItems(response?.data?.carts);
            }
        } catch (err: any) {
            console.error('Error refreshing cart:', err);
            // Don't set error for cart refresh failures, just log them
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (productId: string, quantity: number = 1) => {
        try {
            setLoading(true);
            setError(null);

            // First, get product details
            const productResponse = await axios.get(`${baseUrl}/api/product/${productId}`, {
                withCredentials: true,
            });

            const product = productResponse.data;

            // Check if item already exists in cart
            const existingItemIndex = cartItems.findIndex(item => item.id === productId);

            if (existingItemIndex >= 0) {
                // Update existing item
                const updatedItems = [...cartItems];
                updatedItems[existingItemIndex].quantity += quantity;
                setCartItems(updatedItems);
            } else {
                // Add new item
                const newItem: CartItem = {
                    id: `${productId}-${Date.now()}`, // Generate unique cart item ID
                    product_id: productId,
                    title: product.title,
                    price: product.price,
                    image: product.image,
                    category: product.category,
                    quantity,
                };
                setCartItems([...cartItems, newItem]);
            }

            // Optionally sync with backend cart service
            try {
                await axios.post(`${baseUrl}/api/cart/new`, {
                    productId,
                    quantity,
                }, {
                    withCredentials: true,
                });
            } catch (backendError) {
                console.warn('Failed to sync with backend cart:', backendError);
                // Continue with local cart functionality
            }

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to add item to cart';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        try {
            setLoading(true);
            setError(null);

            if (quantity <= 0) {
                await removeFromCart(itemId);
                return;
            }

            const updatedItems = cartItems.map(item =>
                item.id === itemId ? { ...item, quantity } : item
            );
            setCartItems(updatedItems);

            // Optionally sync with backend
            const item = cartItems.find(item => item.id === itemId);
            if (item) {
                try {
                    await axios.post(`${baseUrl}/cart`, {
                        productId: item.product_id,
                        quantity,
                    }, {
                        withCredentials: true,
                    });
                } catch (backendError) {
                    console.warn('Failed to sync quantity update with backend:', backendError);
                }
            }

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to update quantity';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const removeFromCart = async (itemId: string) => {
        try {
            setLoading(true);
            setError(null);

            const item = cartItems.find(item => item.id === itemId);
            const updatedItems = cartItems.filter(item => item.id !== itemId);
            setCartItems(updatedItems);

            // Optionally sync with backend
            if (item) {
                try {
                    await axios.delete(`${baseUrl}/api/cart/${item.product_id}`, {
                        withCredentials: true,
                    });
                } catch (backendError) {
                    console.warn('Failed to sync removal with backend:', backendError);
                }
            }

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to remove item';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const clearCart = async () => {
        try {
            setLoading(true);
            setError(null);

            setCartItems([]);

            // Optionally sync with backend
            try {
                await axios.delete(`${baseUrl}/api/cart/clear`, {
                    withCredentials: true,
                });
            } catch (backendError) {
                console.warn('Failed to sync cart clear with backend:', backendError);
            }

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to clear cart';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getTotalPrice = (): number => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getTotalItems = (): number => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    return {
        cartItems,
        loading,
        error,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getTotalPrice,
        getTotalItems,
        refreshCart,
    };
};

