import { Box, Typography } from '@mui/material';

import * as Styled from './ProductCard.style.tsx';

export interface IProductCard {
	id: string
	title: string
	price: number
	image: string
	onClick: () => void
}

const ProductCard = ({ id, title, price, image, onClick }: IProductCard) => {
	return (
		<Styled.Container onClick={onClick}>
			<div style={{ position: 'relative' }}>
				<Styled.ProductImage
					src={image}
					alt="Product"
				/>
				<Box
					sx={{
						backgroundColor: '#d6336c',
						color: '#fff',
						borderRadius: '100px',
						width: '50px',
						position: 'absolute',
						top: '10px',
						left: '5px',
						zIndex: 100,
						textAlign: 'center',
					}}
				>
					<Typography
						variant="subtitle1"
						sx={{ fontSize: '10px', fontWeight: 'bold' }}
					>
						Sale
					</Typography>
				</Box>
			</div>
			<Styled.ProductContent>
				<Styled.ProductTag>CAMERA, BEST SELLING</Styled.ProductTag>
				<Styled.ProductTitle>{title}</Styled.ProductTitle>
				<Styled.ProductPrice>${price}</Styled.ProductPrice>
			</Styled.ProductContent>
			<Styled.Button>Add To Cart</Styled.Button>
		</Styled.Container>
	);
};

export default ProductCard;
