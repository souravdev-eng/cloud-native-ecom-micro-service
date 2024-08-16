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
import ProductDetails from './pages/ProductDetails/ProductDetails';
import { HeaderSearch } from './organisms';

function App() {
    const { user } = useAppSelector((state) => state.users);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location?.search);
    const token = queryParams.get('token') as string;

    const pathname = location.pathname;

    const fetchCurrentUser = async () => {
        await dispatch(currentUser());
    };

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        const publicRoutes = [
            '/auth/login',
            '/auth/signup',
            '/auth/forgotpassword',
            '/auth/reset-password',
        ];

        // Only redirect if the user state has been determined
        if (user === undefined) return;

        if (!user && !token && !publicRoutes.includes(pathname)) {
            navigate('/auth/login');
        } else if (user && publicRoutes.includes(pathname)) {
            navigate('/');
        }
    }, [user, pathname, token, navigate]);

    return (
        <>
            <HeaderMenu />
            <HeaderSearch />
            <Routes>
                <Route path='/' Component={HomePage} />
                <Route path='/product-details/:id' Component={ProductDetails} />
                <Route path='/auth/login' Component={LoginPage} />
                <Route path='/auth/signup' Component={SignupPage} />
                <Route
                    path='/auth/forgotpassword'
                    Component={ForgotPasswordPage}
                />
                <Route
                    path='/auth/reset-password'
                    Component={ResetPasswordPage}
                />
            </Routes>
        </>
    );
}

export default App;
