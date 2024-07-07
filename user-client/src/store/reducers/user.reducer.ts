import { createSlice } from '@reduxjs/toolkit';
import { currentUser, loggedOut, userLogin, userSignUp } from '../actions/user/auth.action';
import { userForgotPassword, userRestPassword } from '../actions/user/forgotPassword.action';

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

const handleErrorResponse = (payload: any) => {
  if (payload) {
    return Array.isArray(payload) ? payload : [payload];
  } else {
    return null;
  }
};

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
      state.error = handleErrorResponse(payload);
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
      state.error = handleErrorResponse(payload);
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
      state.error = handleErrorResponse(payload);
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
      state.error = handleErrorResponse(payload);
    });
    // ======================= FORGOT PASSWORD USER =======================
    builder.addCase(userForgotPassword.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(userForgotPassword.fulfilled, (state) => {
      state.loading = false;
    });

    builder.addCase(userForgotPassword.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = handleErrorResponse(payload);
    });

    // ======================= RESET PASSWORD USER =======================
    builder.addCase(userRestPassword.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(userRestPassword.fulfilled, (state) => {
      state.loading = false;
    });

    builder.addCase(userRestPassword.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = handleErrorResponse(payload);
    });
  },
});

export default userSlice.reducer;
