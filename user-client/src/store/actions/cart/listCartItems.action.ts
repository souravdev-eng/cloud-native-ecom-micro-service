import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../../../services/api/baseUrl';

export const listCartItemsAction = createAsyncThunk(
    'listCartItems/cart',
    async (_, { rejectWithValue }) => {
        try {
            const cart = await axios.get(`${BASE_URL}/cart`);
            return cart?.data?.carts;
        } catch (error: any) {
            console.log('Getting error listCartItemsAction()', error);
            throw rejectWithValue(error?.response?.data?.errors);
        }
    }
);
