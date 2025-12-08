import { useState, useEffect } from 'react';
import { productApi } from '../../api/baseUrl';

export interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
  category: string;
  quantity: number;
  rating?: number;
  tags?: string[];
  sellerId: string;
}

export const useProductDetails = (productId: string | undefined) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError('Product ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await productApi.get(`/${productId}`);
        if (response.data) {
          setProduct(response.data);
        } else {
          setError('Product not found');
        }
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Failed to fetch product details'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return { product, loading, error };
};
