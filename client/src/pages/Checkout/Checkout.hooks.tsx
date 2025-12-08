import { useState } from 'react';
import axios from 'axios';
import { baseUrl } from '../../api/baseUrl';

export interface OrderData {
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  shippingInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  total: number;
}

export const useCheckout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeOrder = async (orderData: OrderData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${baseUrl}/api/order/new`, orderData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (err: any) {
      const errorMessage = 
        err.response?.data?.message || 
        err.message || 
        'Failed to place order';
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    placeOrder,
    loading,
    error,
  };
};
