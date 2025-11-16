import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/baseUrl';
import { useAuth } from '../../hooks/useAuth';

export const useSignUp = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConform: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authApi.post('/signup', formData);
      if (response.status === 201) {
        // Refresh auth state to check if user is authenticated
        await checkAuth();
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

  return { formData, loading, error, handleFieldChange, handleSignUp };
};
