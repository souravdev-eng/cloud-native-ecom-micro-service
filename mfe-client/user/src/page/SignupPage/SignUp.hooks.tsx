import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userServiceApi } from '../../api/baseUrl';
import { parseErrorMessage } from '../../utils/parseError';

export const useSignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConform: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await userServiceApi.post('/signup', formData);
      if (response.status === 201) {
        // Refresh auth state to check if user is authenticated
        // await checkAuth();
        navigate('/');
      }
    } catch (error: any) {
      setLoading(false);
      // The auth service reports validation failures as
      // { errors: [{ message }] }, which the old check missed entirely.
      setError(parseErrorMessage(error));
    }
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return { formData, loading, error, handleFieldChange, handleSignUp };
};
