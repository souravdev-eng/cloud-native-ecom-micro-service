import { Typography } from '@mui/material';

import * as Styled from './ProductCard.style.tsx';

export interface IProductCard {
	id: string
	title: string
	price: number
	image: string
	tags: string[]
	onClick: () => void
}

const ProductCard = ({ id, title, price, image, tags, onClick }: IProductCard) => {
	return (
		<Styled.Container onClick={onClick}>
			<div style={{ position: 'relative' }}>
				<Styled.ProductImage
					src={image}
					alt="Product"
				/>
				<Styled.SaleChip>
					<Typography variant="subtitle1" sx={{ fontSize: '10px', fontWeight: 'bold' }}>
						Sale
					</Typography>
				</Styled.SaleChip>
			</div>
			<Styled.ProductContent>
				<Styled.ProductTag>{tags?.slice(0, 4).join(', ').toUpperCase()}</Styled.ProductTag>
				<Styled.ProductTitle>{title}</Styled.ProductTitle>
				<Styled.ProductPrice>${price}</Styled.ProductPrice>
			</Styled.ProductContent>
			<Styled.Button>Add To Cart</Styled.Button>
		</Styled.Container>
	);
};

export default ProductCard;
