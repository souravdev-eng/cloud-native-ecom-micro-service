import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import './App.css';
import HeaderMenu from './organisms/HeaderMenu/HeaderMenu';
import HeaderSearch from './organisms/HeaderSearch/HeaderSearch';

function App() {
  return (
    <BrowserRouter>
      <HeaderMenu />
      <HeaderSearch />
      <Routes>
        <Route path='/' Component={HomePage} />
        {/* <Route path='/product-details/:id' Component={ProductDetails} />
        <Route path='/auth/signup' Component={Signup} />
        <Route path='/auth/login' Component={Login} />
        <Route path='/auth/forgot-password' Component={ForgotPassword} />
        <Route path='/auth/reset-password' Component={ResetPassword} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
