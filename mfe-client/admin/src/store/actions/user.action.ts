import { createAsyncThunk } from '@reduxjs/toolkit'
import { authServiceApi } from '../../api/baseUrl'

export const fetchCurrentUser = createAsyncThunk('user/fetchCurrentUser', async (_, { rejectWithValue }) => {
    try {
        const response = await authServiceApi.get('/currentuser')
        console.log(response.data)
        return response.data.currentUser
    } catch (error: any) {
        console.log(error.response.data.errors)
        return rejectWithValue(error?.response?.data?.errors)
    }
})
export const signOut = createAsyncThunk('user/signOut', async (_, { rejectWithValue }) => {
    try {
        const response = await authServiceApi.post('/signout')
        return response.data
    } catch (error: any) {
        return rejectWithValue(error?.response?.data?.errors)
    }
})

export const signIn = createAsyncThunk('user/login', async (formData: { email: string, password: string }, { rejectWithValue }) => {
    try {
        const response = await authServiceApi.post('/login', {
            email: formData.email,
            password: formData.password,
        })
        console.log(response.data)
        return response.data
    } catch (error: any) {
        return rejectWithValue(error?.response?.data?.errors)
    }
})
export const signUp = createAsyncThunk('user/signUp', async (formData: { name: string, email: string, password: string, passwordConform: string }, { rejectWithValue }) => {
    try {
        const response = await authServiceApi.post('/signup', {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            passwordConform: formData.passwordConform,
        })
        console.log(response.data)
        return response.data
    } catch (error: any) {
        return rejectWithValue(error?.response?.data?.errors)
    }
})
