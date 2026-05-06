import { useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { signIn } from '../store/actions/user.action';
import { UserErrorProps } from '../store/reducers/user.reducer';

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
    const dispatch = useDispatch<AppDispatch>();
    const { userInfo, loading, error } = useSelector((state: RootState) => state.user)
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: '',
        rememberMe: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<any>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        // Clear error when user starts typing
        if (errors[name as keyof UserErrorProps]) {
            setErrors((prev: UserErrorProps) => ({ ...prev, [name]: undefined }));
        }
        // Clear API error when user starts typing
        if (error && Array.isArray(error) && error.length > 0 && error[0]?.message && error[0]?.field) {
            setErrors((prev: UserErrorProps) => ({ ...prev, [error[0]?.field]: error[0]?.message }));
        } else {
            setErrors((prev: UserErrorProps) => ({ ...prev, [name]: undefined }));
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
        dispatch(signIn({ email: formData.email, password: formData.password }))
    };

    return {
        formData,
        loading,
        error,
        showPassword,
        setShowPassword,
        handleChange,
        handleSubmit,
    };
};

