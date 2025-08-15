import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import ProductCard from './components/ProductCard/ProductCard';
import './index.css';

const App = () => (
  <Routes>
    <Route
      path='/'
      element={
        <>
          <Header />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
          </div>
        </>
      }
    />
    <Route path='*' element={<div>Auth page not found</div>} />
  </Routes>
);

export default App;
