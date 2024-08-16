import { createSlice } from '@reduxjs/toolkit';
import { productListAction } from '../actions/product/productList.action';
import { CustomError, Product } from '../types/product.type';
import { handleErrorResponse } from '../../utils/errorTransform';
import { productDetailsAction } from '../actions/product/productDetails.action';

interface InitialStateProps {
    productList: Product[];
    productDetail: Product | null;
    loading: boolean;
    error: CustomError[] | null;
}

const initialState = {
    loading: false,
    productList: [],
    productDetail: null,
    error: null,
} as InitialStateProps;

const productSlice = createSlice({
    name: 'product',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(productListAction.pending, (state) => {
            state.loading = true;
        });

        builder.addCase(productListAction.fulfilled, (state, { payload }) => {
            state.loading = false;
            state.productList = payload;
        });

        builder.addCase(productListAction.rejected, (state, { payload }) => {
            state.loading = false;
            state.productList = [];
            state.error = handleErrorResponse(payload);
        });

        builder.addCase(productDetailsAction.pending, (state) => {
            state.loading = true;
        });

        builder.addCase(
            productDetailsAction.fulfilled,
            (state, { payload }) => {
                state.loading = false;
                state.productDetail = payload;
            }
        );
        builder.addCase(productDetailsAction.rejected, (state, { payload }) => {
            state.loading = false;
            state.productDetail = null;
            state.error = handleErrorResponse(payload);
        });
    },
});

export default productSlice.reducer;
