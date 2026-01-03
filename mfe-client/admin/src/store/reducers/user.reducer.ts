import { createSlice } from '@reduxjs/toolkit'
import { fetchCurrentUser, signOut, signIn, signUp } from '../actions/user.action';

export interface UserErrorProps {
    message: string;
    field?: string;
}[];

interface UserStateProps {
    userInfo: {
        name: string;
        email: string;
        role: string;
    } | null
    loading: boolean;
    error: UserErrorProps | null
}

const initialState: UserStateProps = {
    userInfo: null,
    loading: false,
    error: null
}

const counterSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder.addCase(fetchCurrentUser.pending, (state) => {
            state.loading = true
            state.error = null
        });
        builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
            state.loading = false
            state.userInfo = action.payload
        });
        builder.addCase(fetchCurrentUser.rejected, (state, { payload }) => {
            state.loading = false
            state.error = payload as UserErrorProps
        });
        builder.addCase(signOut.pending, (state) => {
            state.loading = true
            state.error = null
        });
        builder.addCase(signOut.fulfilled, (state, action) => {
            state.loading = false
            state.userInfo = null
        });
        builder.addCase(signOut.rejected, (state, { payload }) => {
            state.loading = false
            state.error = payload as UserErrorProps
        });
        builder.addCase(signIn.pending, (state) => {
            state.loading = true
            state.error = null
        });
        builder.addCase(signIn.fulfilled, (state, action) => {
            state.loading = false
            state.userInfo = action.payload
        });
        builder.addCase(signIn.rejected, (state, { payload }) => {
            state.loading = false
            state.error = payload as UserErrorProps
        });
        builder.addCase(signUp.pending, (state) => {
            state.loading = true
            state.error = null
        });
        builder.addCase(signUp.fulfilled, (state, action) => {
            state.loading = false
            state.userInfo = action.payload
        });
        builder.addCase(signUp.rejected, (state, { payload }) => {
            state.loading = false
            state.error = payload as UserErrorProps
        });
    },
})


export default counterSlice.reducer