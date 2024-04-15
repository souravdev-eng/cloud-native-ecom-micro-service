import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { userLogin } from '../../store/actions/user/auth.action';
import { toast } from 'react-toastify';

interface ResponseError {
  message: string;
  field?: string;
}

export const useLogin = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.users);
  const [userFormData, setUserFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setUserFormData({
      ...userFormData,
      [name]: value,
    });
  };

  const handleLogin = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    const response = await dispatch(userLogin({ ...userFormData }));

    if (response?.type === 'user/login/fulfilled') {
      toast.success('Successfully login');
      navigate('/');
    } else if (response.type === 'user/login/rejected') {
      (response?.payload as ResponseError[])?.map((el) => toast.error(el.message));
    } else {
      toast.error('Something went wrong');
    }
  };

  useEffect(() => {
    if (user && user?.email) {
      return navigate('/');
    }
  }, [user?.email]);

  return { handleLogin, handleInputChange, userFormData };
};
