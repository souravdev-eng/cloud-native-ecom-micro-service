import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/baseUrl';
import { useAuth } from '../../hooks/useAuth';

export const useLogin = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authApi.post('/login', formData);
      if (response.status === 200) {
        // Refresh auth state to check if user is authenticated
        await checkAuth();
        navigate('/');
      }
    } catch (error: any) {
      setLoading(false);
      if (error.response?.data?.errors?.length > 0) {
        setError(error.response.data.errors.map((error: any) => error.message).join(', '));
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Invalid email or password. Please try again.');
      }
    }
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return { formData, loading, error, handleFieldChange, handleLogin };
};
