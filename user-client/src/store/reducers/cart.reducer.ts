import { createSlice } from '@reduxjs/toolkit';
import { addToCartAction } from '../actions/cart/addToCart.action';
import { listCartItemsAction } from '../actions/cart/listCartItems.action';

interface Product {
    product_id: string;
    cart_id: string;
    title: string;
    image: string;
    price: number;
    quantity: number;
    total: number;
}

interface InitialStateProps {
    loading: Boolean;
    cartList: Product[] | [];
    error: any;
}

const initialState = {
    loading: false,
    cartList: [],
    error: null,
} as InitialStateProps;

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(addToCartAction.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(addToCartAction.fulfilled, (state, { payload }) => {
            state.loading = false;
        });
        builder.addCase(addToCartAction.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload;
        });

        builder.addCase(listCartItemsAction.pending, (state) => {
            state.loading = true;
        });

        builder.addCase(listCartItemsAction.fulfilled, (state, { payload }) => {
            state.loading = false;
            state.cartList = payload;
        });

        builder.addCase(listCartItemsAction.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload;
        });
    },
});

export default cartSlice.reducer;
