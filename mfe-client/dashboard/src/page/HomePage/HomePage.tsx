import React from 'react';

import { useNavigate } from 'react-router-dom';

import ProductCard from '../../components/ProductCard/ProductCard';

const HomePage = () => {
	const navigate = useNavigate();

	return (
		<div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
			{Array.from({ length: 10 }).map((_, index) => (
				<ProductCard
					key={index}
					onClick={() => navigate(`/product/${index}`)}
				/>
			))}
		</div>
	);
};

export default HomePage;
