import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';

import HomePage from './pages/HomePage';
import HeaderMenu from './organisms/HeaderMenu/HeaderMenu';

function App() {
  return (
    <BrowserRouter>
      <HeaderMenu />
      <Routes>
        <Route path='/' Component={HomePage} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
