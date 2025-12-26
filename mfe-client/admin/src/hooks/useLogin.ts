import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authServiceApi } from '../api/baseUrl';
import { useAuth } from './useAuth';

export interface LoginFormData {
    email: string;
    password: string;
    rememberMe: boolean;
}

export interface LoginFormErrors {
    email?: string;
    password?: string;
}

export const useLogin = () => {
    const navigate = useNavigate();
    const { checkAuth } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: '',
        rememberMe: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<LoginFormErrors>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        // Clear error when user starts typing
        if (errors[name as keyof LoginFormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
        // Clear API error when user starts typing
        if (error) {
            setError('');
        }
    };

    const validateForm = (): boolean => {
        const newErrors: LoginFormErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            const response = await authServiceApi.post('/login', {
                email: formData.email,
                password: formData.password,
            });

            if (response.status === 200) {
                // Refresh auth state
                await checkAuth();
                // Navigate to dashboard
                navigate('/');
            }
        } catch (err: any) {
            if (err.response?.data?.errors?.[0]?.message) {
                setError(err.response.data.errors[0].message);
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.message) {
                setError(err.message);
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        loading,
        error,
        errors,
        showPassword,
        setShowPassword,
        handleChange,
        handleSubmit,
    };
};

