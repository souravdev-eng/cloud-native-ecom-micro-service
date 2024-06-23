import { createSlice } from '@reduxjs/toolkit';
import { currentUser, loggedOut, userLogin, userSignUp } from '../actions/user/auth.action';

type User = {
  id?: string;
  email: string;
  role?: string;
};

type UserError = {
  message: string;
  field?: string;
};

interface InitialStateProps {
  user: User | null;
  loading: boolean;
  error: UserError[] | null;
}

const initialState = {
  loading: false,
  user: null,
  error: null,
} as InitialStateProps;

const userSlice = createSlice({
  name: 'userSlice',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // ======================= SIGNUP =======================
    builder.addCase(userSignUp.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(userSignUp.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.user = payload;
    });

    builder.addCase(userSignUp.rejected, (state, { payload }) => {
      state.loading = false;
      state.user = null;
      if (payload) {
        state.error = Array.isArray(payload) ? payload : [payload];
      } else {
        state.error = null;
      }
    }),
      // ======================= LOGIN =======================
      builder.addCase(userLogin.pending, (state) => {
        state.loading = true;
      });

    builder.addCase(userLogin.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.user = payload;
    });

    builder.addCase(userLogin.rejected, (state, { payload }) => {
      state.loading = false;
      state.user = null;
      if (payload) {
        state.error = Array.isArray(payload) ? payload : [payload];
      } else {
        state.error = null;
      }
    }),
      // ======================= CURRENT USER =======================
      builder.addCase(currentUser.pending, (state) => {
        state.loading = true;
      });

    builder.addCase(currentUser.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.user = payload;
    });

    builder.addCase(currentUser.rejected, (state, { payload }) => {
      state.loading = false;
      state.user = null;
      if (payload) {
        state.error = Array.isArray(payload) ? payload : [payload];
      } else {
        state.error = null;
      }
    });
    // ======================= LOGGED OUT USER =======================
    builder.addCase(loggedOut.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(loggedOut.fulfilled, (state) => {
      state.loading = false;
      state.user = null;
    });

    builder.addCase(loggedOut.rejected, (state, { payload }) => {
      state.loading = false;
      state.user = null;
      if (payload) {
        state.error = Array.isArray(payload) ? payload : [payload];
      } else {
        state.error = null;
      }
    });
  },
});

export default userSlice.reducer;
