import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { BASE_URL } from '../../../services/api/baseUrl';

export const productListAction = createAsyncThunk(
    'product/list-all',
    async (_, { rejectWithValue }) => {
        try {
            const product = await axios.get(`${BASE_URL}/product`);
            return product?.data;
        } catch (error: any) {
            console.log('Product List action error: ', error);
            throw rejectWithValue(error?.response?.data?.errors);
        }
    }
);
