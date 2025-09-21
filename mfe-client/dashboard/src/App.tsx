import React from 'react';

import { Route, Routes } from 'react-router-dom';

import './index.css';

import Header from './components/Header/Header';
import HomePage from './page/HomePage/HomePage';
import ProductDetails from './page/ProductDetails/ProductDetails';

const App = () => (
	<Header>
		<Routes>
			<Route
				path="/"
				element={
					<>
						<HomePage />
						<HomePage />
					</>
				}
			/>
			<Route index path="/product/:id" element={<ProductDetails />} />
			<Route path="*" element={<div>Auth page not found</div>} />
		</Routes>
	</Header>
);

export default App;
