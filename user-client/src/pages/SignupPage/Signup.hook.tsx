import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

import { userSignUp } from '../../store/actions/user/auth.action';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';

interface ResponseError {
  message: string;
  field?: string;
}

export const useSignup = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.users);
  const navigate = useNavigate();

  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConform: '',
  });

  const handleInputChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setUserFormData({
      ...userFormData,
      [name]: value,
    });
  };
  const handleSignup = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const response = await dispatch(userSignUp({ ...userFormData }));

    if (response?.type === 'user/signup/fulfilled') {
      toast.success('Successfully signup');
      navigate('/');
    } else if (response.type === 'user/signup/rejected') {
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

  return { userFormData, handleInputChange, handleSignup };
};
