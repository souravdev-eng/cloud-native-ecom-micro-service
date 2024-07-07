import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Route, Routes } from 'react-router-dom';

import HeaderMenu from './organisms/HeaderMenu/HeaderMenu';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage/LoginPage';
import SignupPage from './pages/SignupPage/SignupPage';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage';

import { useAppDispatch, useAppSelector } from './hooks/useRedux';
import { currentUser } from './store/actions/user/auth.action';
import './App.css';

function App() {
  const { user } = useAppSelector((state) => state.users);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchCurrentUser = async () => {
    await dispatch(currentUser());
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    const pathname = location.pathname;

    const publicRoutes = [
      '/auth/login',
      '/auth/signup',
      '/auth/forgotpassword',
      '/auth/reset-password',
    ];

    if (!user && !token && !publicRoutes.includes(pathname)) {
      navigate('/auth/login');
    } else {
      navigate('/');
    }
  }, [user, location]);

  return (
    <>
      <HeaderMenu />
      <Routes>
        <Route path='/' Component={HomePage} />
        <Route path='/auth/login' Component={LoginPage} />
        <Route path='/auth/signup' Component={SignupPage} />
        <Route path='/auth/forgotpassword' Component={ForgotPasswordPage} />
        <Route path='/auth/reset-password' Component={ResetPasswordPage} />
      </Routes>
    </>
  );
}

export default App;
