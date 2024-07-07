import { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { userForgotPassword } from '../../store/actions/user/forgotPassword.action';

interface ResponseError {
  message: string;
  field?: string;
}

export const useForgotPassword = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.users);

  const [email, setEmail] = useState('');

  const handleInputChange = (e: { target: { name?: any; value: any } }) => {
    setEmail(e.target.value);
  };

  const handleForgotPassword = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    const response = await dispatch(userForgotPassword({ email: email }));

    if (response?.type === 'user/forgot-password/fulfilled') {
      toast.success('Forgot password reset link sent to your email');
    } else if (response.type === 'user/login/rejected') {
      (response?.payload as ResponseError[])?.map((el) => toast.error(el.message));
    } else {
      toast.error('Something went wrong');
    }
  };

  return { handleForgotPassword, handleInputChange, email, loading };
};
