import { useParams } from 'react-router-dom';

import * as Styled from './ProductDetails.styles';
import { useProductDetails } from './ProductDetails.hook';
import Rating from '@mui/material/Rating';
import { Box } from '@mui/material';

const ProductDetails = () => {
	const { product, handleAddToCart } = useProductDetails()
	console.log("product", product)
	return (
		<Styled.Container>
			<Styled.ProductImageContainer>
				<Styled.ProductImage
					src={product?.image}
					alt="Product"
				/>
			</Styled.ProductImageContainer>
			<Styled.ProductDetailsContainer>
				<Styled.ProductTitle>{product?.title}</Styled.ProductTitle>
				<Styled.ProductPrice>${product?.price}</Styled.ProductPrice>
				<Styled.ProductDescription>
					{product?.description || 'No description available'}
				</Styled.ProductDescription>
				<Box>
					<Rating name="half-rating-read" value={Number(product?.rating)} precision={0.5} readOnly />
				</Box>
				<Styled.AddToCartButton onClick={() => handleAddToCart()}>Add To Cart</Styled.AddToCartButton>
			</Styled.ProductDetailsContainer>
		</Styled.Container>
	);
};

export default ProductDetails;
