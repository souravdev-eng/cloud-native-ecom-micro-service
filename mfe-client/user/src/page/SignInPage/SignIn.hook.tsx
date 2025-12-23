import { useState } from 'react';
import { userServiceApi } from '../../api/baseUrl';
import { useNavigate } from 'react-router-dom';

export const useSignIn = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await userServiceApi.post('/login', formData);
            if (response.status === 200) {
                navigate('/');
            }
        } catch (error: any) {
            setLoading(false);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else if (error.message) {
                setError(error.message);
            } else {
                setError('Something went wrong. Please try again.');
            }
        }
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return {
        formData,
        loading,
        error,
        handleFieldChange,
        handleSignIn,
    };
};