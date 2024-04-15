import { configureStore } from '@reduxjs/toolkit';
import userSliceReducer from './reducers/user.reducer';

export const store = configureStore({
  reducer: {
    users: userSliceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
