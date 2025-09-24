import React from 'react';

import * as Styled from './ProductCard.style.tsx';

const ProductCard = ({ onClick }: { onClick: () => void }) => {
	return (
		<Styled.Container onClick={onClick}>
			<div>
				<Styled.ProductImage
					src="https://porto-demo.myshopify.com/cdn/shop/products/BrownWomenCasualHandBag_600x_crop_center.jpg?v=1606122820"
					alt="Product"
				/>
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
