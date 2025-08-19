import { useParams } from 'react-router-dom';

import * as Styled from './ProductDetails.styles';

const ProductDetails = () => {
	const { id } = useParams();

	return (
		<Styled.Container>
			<Styled.ProductImageContainer>
				<Styled.ProductImage
					src="https://porto-demo.myshopify.com/cdn/shop/products/BrownWomenCasualHandBag_600x_crop_center.jpg?v=1606122820"
					alt="Product"
				/>
			</Styled.ProductImageContainer>
			<Styled.ProductDetailsContainer>
				<Styled.ProductTitle>Brown Women Casual HandBag</Styled.ProductTitle>
				<Styled.ProductPrice>$209.00</Styled.ProductPrice>
				<Styled.ProductDescription>
					Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
					quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
					Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing
					elit. Quisquam, quos.
				</Styled.ProductDescription>
				<Styled.AddToCartButton>Add To Cart</Styled.AddToCartButton>
			</Styled.ProductDetailsContainer>
		</Styled.Container>
	);
};

export default ProductDetails;
