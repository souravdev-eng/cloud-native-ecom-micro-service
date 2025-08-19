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
				<h3>Brown Women Casual HandBag</h3>
				<span>$209.00</span>
			</div>
			<button>Add To Cart</button>
		</Styled.Container>
	);
};

export default ProductCard;
