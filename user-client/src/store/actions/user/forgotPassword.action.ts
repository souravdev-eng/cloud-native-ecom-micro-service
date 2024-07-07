import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { BASE_URL } from '../../../services/api/baseUrl';

export const userForgotPassword = createAsyncThunk(
  'user/forgot-password',
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const { message }: { message: string } = await axios.post(
        `${BASE_URL}/users/forgot-password`,
        { email },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return message;
    } catch (error: any) {
      console.log('User forgot password action error: ', error);
      throw rejectWithValue(error?.response?.data?.errors);
    }
  }
);

interface ResetPasswordProps {
  email: string;
  token: string;
  newPassword: string;
}

export const userRestPassword = createAsyncThunk(
  'user/reset-password',
  async (params: ResetPasswordProps, { rejectWithValue }) => {
    try {
      const { message }: { message: string } = await axios.put(
        `${BASE_URL}/users/reset-password`,
        { ...params },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return message;
    } catch (error: any) {
      console.log('User forgot password action error: ', error);
      throw rejectWithValue(error?.response?.data?.errors);
    }
  }
);
