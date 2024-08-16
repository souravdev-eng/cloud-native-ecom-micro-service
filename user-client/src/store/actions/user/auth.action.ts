import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { BASE_URL } from '../../../services/api/baseUrl';

type UserSignupPayload = {
    name: string;
    email: string;
    password: string;
    passwordConform: string;
};

type UserLoginPayload = {
    email: string;
    password: string;
};

type UserResponse = {
    data: {
        id: string;
        name: string;
        email: string;
        role?: string;
    };
};

type CurrentUserResponse = {
    data: {
        currentUser: {
            id: string;
            name: string;
            email: string;
            role?: string;
        };
    };
};

export const userSignUp = createAsyncThunk(
    'user/signup',
    async (userData: UserSignupPayload, { rejectWithValue }) => {
        try {
            const user: UserResponse = await axios.post(
                `${BASE_URL}/users/signup`,
                { ...userData },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            return user?.data;
        } catch (error: any) {
            console.log('User signup action error: ', error);
            throw rejectWithValue(error?.response?.data?.errors);
        }
    }
);

export const userLogin = createAsyncThunk(
    'user/login',
    async (userData: UserLoginPayload, { rejectWithValue }) => {
        try {
            const user: UserResponse = await axios.post(
                `${BASE_URL}/users/login`,
                { ...userData },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            return user?.data;
        } catch (error: any) {
            console.log('User login action error: ', error);
            throw rejectWithValue(error?.response?.data?.errors);
        }
    }
);

export const loggedOut = createAsyncThunk(
    'user/loggedout',
    async (_, { rejectWithValue }) => {
        try {
            await axios.post(
                `${BASE_URL}/users/signout`,
                {},
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            return null;
        } catch (error: any) {
            console.log('User sign out action error: ', error);
            throw rejectWithValue(error?.response?.data?.errors);
        }
    }
);

export const currentUser = createAsyncThunk(
    'user/currentuser',
    async (_, { rejectWithValue }) => {
        try {
            const user: CurrentUserResponse = await axios.get(
                `${BASE_URL}/users/currentuser`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            return user?.data?.currentUser;
        } catch (error: any) {
            console.log('Current Users action error: ', error);
            throw rejectWithValue(error?.response?.data?.errors);
        }
    }
);
