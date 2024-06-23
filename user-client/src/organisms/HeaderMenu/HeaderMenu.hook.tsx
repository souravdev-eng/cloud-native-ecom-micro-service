import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/useRedux';
import { loggedOut } from '../../store/actions/user/auth.action';

export const useHeaderMenu = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLoggedOut = async () => {
    await dispatch(loggedOut());
    navigate('/auth/login');
  };

  return { handleLoggedOut };
};
