import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import AuthApp from 'auth/App';
import Dashboard from 'dashboard/App';

import './index.css';

const App = () => (
  <BrowserRouter>
    <div className='bg-gray-100'>
      <Routes>
        <Route path='/user/auth/sign-in' element={<AuthApp />} />
        <Route path='/sign-up' element={<AuthApp />} />
        <Route path='/forgot-password' element={<AuthApp />} />
        <Route path='/reset-password' element={<AuthApp />} />
        <Route path='/verify-email' element={<AuthApp />} />
        <Route path='/verify-email-sent' element={<AuthApp />} />
        <Route path='/verify-email-success' element={<AuthApp />} />
        <Route path='/verify-email-failed' element={<AuthApp />} />
        <Route path='/' element={<Dashboard />} />
      </Routes>
    </div>
  </BrowserRouter>
);

const root = ReactDOM.createRoot(document.getElementById('app') as HTMLElement);

root.render(<App />);
