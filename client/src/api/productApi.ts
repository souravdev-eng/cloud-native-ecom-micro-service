import axios from 'axios';
import { baseUrl } from './baseUrl';

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

export const productApi = {
  // Get all products
  getAllProducts: async (): Promise<Product[]> => {
    const response = await axios.get(`${baseUrl}/api/product`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Get product by ID
  getProductById: async (productId: string): Promise<Product> => {
    const response = await axios.get(`${baseUrl}/api/product/${productId}`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Search products
  searchProducts: async (query: string): Promise<Product[]> => {
    const response = await axios.get(`${baseUrl}/api/product/search`, {
      params: { q: query },
      withCredentials: true,
    });
    return response.data;
  },

  // Get products by category
  getProductsByCategory: async (category: string): Promise<Product[]> => {
    const response = await axios.get(`${baseUrl}/api/product/category/${category}`, {
      withCredentials: true,
    });
    return response.data;
  },
};

export default productApi;
