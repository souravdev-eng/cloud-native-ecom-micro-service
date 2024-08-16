import { configureStore } from '@reduxjs/toolkit';
import userSliceReducer from './reducers/user.reducer';
import productReducer from './reducers/product.reducer';

export const store = configureStore({
    reducer: {
        users: userSliceReducer,
        product: productReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
