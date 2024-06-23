import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Route, Routes } from 'react-router-dom';

import HomePage from './pages/HomePage';
import HeaderMenu from './organisms/HeaderMenu/HeaderMenu';
import LoginPage from './pages/LoginPage/LoginPage';
import SignupPage from './pages/SignupPage/SignupPage';
import { useAppDispatch, useAppSelector } from './hooks/useRedux';
import { currentUser } from './store/actions/user/auth.action';
import './App.css';

function App() {
  const { user } = useAppSelector((state) => state.users);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const fetchCurrentUser = async () => {
    await dispatch(currentUser());
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!user) navigate('/auth/login');
  }, [user]);

  return (
    <>
      <HeaderMenu />
      <Routes>
        <Route path='/' Component={HomePage} />
        <Route path='/auth/login' Component={LoginPage} />
        <Route path='/auth/signup' Component={SignupPage} />
      </Routes>
    </>
  );
}

export default App;
