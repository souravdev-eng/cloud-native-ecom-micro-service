import React from 'react';
import { CssBaseline, StyledEngineProvider } from '@mui/material';

import { Route, Routes } from 'react-router-dom';

import './index.css';

import Header from './components/Header/Header';
import HomePage from './page/HomePage/HomePage';
import ProductDetails from './page/ProductDetails/ProductDetails';

const App = () => (
	<StyledEngineProvider injectFirst>
		<CssBaseline />
		<Header>
			<Routes>
				<Route
					path="/"
					element={
						<>
							<HomePage />
						</>
					}
				/>
				<Route index path="/product/:id" element={<ProductDetails />} />
				<Route path="*" element={<div>Auth page not found</div>} />
			</Routes>
		</Header>
	</StyledEngineProvider>
);

export default App;
