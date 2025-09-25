import React from 'react';
import { Box, Typography } from '@mui/material';

import * as Styled from './ProductCard.style.tsx';

const ProductCard = ({ onClick }: { onClick: () => void }) => {
	return (
		<Styled.Container onClick={onClick}>
			<div style={{ position: 'relative' }}>
				<Styled.ProductImage
					src="https://porto-demo.myshopify.com/cdn/shop/products/BrownWomenCasualHandBag_600x_crop_center.jpg?v=1606122820"
					alt="Product"
				/>
				<Box sx={{
					backgroundColor: '#d6336c', color: '#fff',
					borderRadius: '100px',
					width: '50px',
					position: 'absolute',
					top: '10px',
					left: '5px',
					zIndex: 100,
					textAlign: 'center',
				}}>
					<Typography variant="subtitle1" sx={{ fontSize: '10px', fontWeight: 'bold' }}>Sale</Typography>
				</Box>
			</div>
			<div>
				<Styled.ProductTag>CAMERA, BEST SELLING</Styled.ProductTag>
				<Styled.ProductTitle>Brown Women Casual HandBag</Styled.ProductTitle>
				<Styled.ProductPrice>$209.00</Styled.ProductPrice>
			</div>
			<Styled.Button>Add To Cart</Styled.Button>

		</Styled.Container>
	);
};

export default ProductCard;
