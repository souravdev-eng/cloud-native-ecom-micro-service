import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { BASE_URL } from '../../../services/api/baseUrl';

export const productDetailsAction = createAsyncThunk(
    'product/details',
    async ({ id }: { id: string }, { rejectWithValue }) => {
        try {
            const product = await axios.get(`${BASE_URL}/product/${id}`);
            return product?.data;
        } catch (error: any) {
            console.log('Product details action error: ', error);
            throw rejectWithValue(error?.response?.data?.errors);
        }
    }
);
