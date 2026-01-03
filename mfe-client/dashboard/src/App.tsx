import React from 'react';
import { CssBaseline, StyledEngineProvider } from '@mui/material';

import { Route, Routes } from 'react-router-dom';

import './index.css';

import Header from './components/Header/Header';
import HomePage from './page/HomePage/HomePage';
import ProductDetails from './page/ProductDetails/ProductDetails';
import ProductsPage from './page/ProductsPage/ProductsPage';

const App = () => (
	<StyledEngineProvider injectFirst>
		<CssBaseline />
		<Header>
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/products" element={<ProductsPage />} />
				<Route path="/product/:id" element={<ProductDetails />} />
				<Route path="*" element={<div>Page not found</div>} />
			</Routes>
		</Header>
	</StyledEngineProvider>
);

export default App;
