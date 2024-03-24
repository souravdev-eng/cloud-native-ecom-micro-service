import Header from './components/Header/Header';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Signup from './page/Signup/Signup';
import HomePage from './page/Home/HomePage';
import Login from './page/Login/LoginPage';
import ForgotPassword from './page/ForgotPassword/ForgotPassword';
import ResetPassword from './page/ResetPassword/ResetPassword';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path='/' Component={HomePage} />
        <Route path='/auth/signup' Component={Signup} />
        <Route path='/auth/login' Component={Login} />
        <Route path='/auth/forgot-password' Component={ForgotPassword} />
        <Route path='/auth/reset-password' Component={ResetPassword} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
