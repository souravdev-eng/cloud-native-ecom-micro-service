import React from 'react';

import { useNavigate } from 'react-router-dom';

import ProductCard from '../../components/ProductCard/ProductCard';

const HomePage = () => {
	const navigate = useNavigate();

	return (
		<div style={{
			display: 'flex', flexDirection: 'column', alignItems: 'center',
			width: '100%'
		}}>
			<h3>FEATURED PRODUCTS</h3>
			<div style={{
				display: 'flex', gap: 20, flexWrap: 'wrap',
				justifyContent: 'center', alignItems: 'center',
				marginTop: 20
			}}>
				{Array.from({ length: 4 }).map((_, index) => (
					<ProductCard
						key={index}
						onClick={() => navigate(`/product/${index}`)}
					/>
				))}
			</div>
		</div>
	);
};

export default HomePage;
