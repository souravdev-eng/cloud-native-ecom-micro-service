import { useState } from 'react';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { userRestPassword } from '../../store/actions/user/forgotPassword.action';

interface ResponseError {
  message: string;
  field?: string;
}

export const useResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.users);

  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const email = queryParams.get('email');

  const [newPassword, setNewPassword] = useState('');

  const handleInputChange = (e: { target: { name?: any; value: any } }) => {
    setNewPassword(e.target.value);
  };

  const handleResetPassword = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    if (token && email) {
      const response = await dispatch(
        userRestPassword({ email: email, token: token, newPassword: newPassword })
      );

      if (response?.type === 'user/reset-password/fulfilled') {
        toast.success('Password updated successfully');
        navigate('/auth/login');
      } else if (response.type === 'user/reset-password/rejected') {
        (response?.payload as ResponseError[])?.map((el) => toast.error(el.message));
      } else {
        toast.error('Something went wrong');
      }
    }
  };

  return { handleResetPassword, handleInputChange, newPassword, loading, email };
};
