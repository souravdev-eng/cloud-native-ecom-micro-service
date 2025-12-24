import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const authApi = axios.create({
    baseURL: 'http://localhost:3100/api/users',
    withCredentials: true,
});

interface AuthState {
    isAuthenticated: boolean;
    loading: boolean;
    user: any | null;
}

interface UseAuthReturn extends AuthState {
    logout: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
    const [state, setState] = useState<AuthState>({
        isAuthenticated: false,
        loading: true,
        user: null,
    });

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await authApi.get('/currentuser');
                if (response.status === 200 && response.data?.currentUser) {
                    setState({
                        isAuthenticated: true,
                        loading: false,
                        user: response.data.currentUser,
                    });
                } else {
                    setState({ isAuthenticated: false, loading: false, user: null });
                }
            } catch {
                setState({ isAuthenticated: false, loading: false, user: null });
            }
        };

        checkAuth();
    }, []);

    const logout = useCallback(async () => {
        try {
            await authApi.post('/signout');
        } catch {
            // Ignore errors on logout
        } finally {
            setState({ isAuthenticated: false, loading: false, user: null });
        }
    }, []);

    return { ...state, logout };
};

