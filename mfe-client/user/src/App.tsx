import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SignUp from './components/SignUp';
import './index.css';

const App = () => (
  <Routes>
    <Route path='/user/auth/signin' element={<SignUp />} />
    <Route path='/user/auth/signup' element={<div>Sign Up Page</div>} />
    <Route path='/user/auth/forgot-password' element={<div>Forgot Password</div>} />
    <Route path='/user/sign-up' element={<SignUp />} />
    <Route path='/user/profile' element={<div>User Profile</div>} />
    <Route path='*' element={<div>Auth page not found</div>} />
  </Routes>
);

export default App;
