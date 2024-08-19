import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../../../services/api/baseUrl';

export const addToCartAction = createAsyncThunk(
    'add-to-cart/cart',
    async (
        { productId, quantity }: { productId: string; quantity: number },
        { rejectWithValue }
    ) => {
        try {
            const cart = await axios.post(
                `${BASE_URL}/cart`,
                { productId, quantity },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            return cart?.data;
        } catch (error: any) {
            console.log('Getting error while add to cart in DB', error);
            throw rejectWithValue(error?.response?.data?.errors);
        }
    }
);
