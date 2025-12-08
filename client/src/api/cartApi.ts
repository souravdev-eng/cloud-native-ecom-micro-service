import axios from 'axios';
import { baseUrl } from './baseUrl';

export interface CartItem {
  id: string;
  product: {
    id: string;
    title: string;
    price: number;
    image: string;
    category?: string;
  };
  quantity: number;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartRequest {
  quantity: number;
}

export const cartApi = {
  // Get all cart items
  getCartItems: async (): Promise<CartItem[]> => {
    const response = await axios.get(`${baseUrl}/api/cart`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Add item to cart
  addToCart: async (data: AddToCartRequest): Promise<CartItem> => {
    const response = await axios.post(`${baseUrl}/api/cart/new`, data, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  // Update cart item quantity
  updateCartItem: async (productId: string, data: UpdateCartRequest): Promise<CartItem> => {
    const response = await axios.put(`${baseUrl}/api/cart/${productId}`, data, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  // Remove item from cart
  removeFromCart: async (productId: string): Promise<void> => {
    await axios.delete(`${baseUrl}/api/cart/${productId}`, {
      withCredentials: true,
    });
  },

  // Clear entire cart
  clearCart: async (): Promise<void> => {
    await axios.delete(`${baseUrl}/api/cart/clear`, {
      withCredentials: true,
    });
  },
};

export default cartApi;
