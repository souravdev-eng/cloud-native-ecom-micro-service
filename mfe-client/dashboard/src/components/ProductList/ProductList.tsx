import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { useNavigate } from 'react-router-dom';

import * as Styled from './ProductList.style';

import ProductCard from '../ProductCard/ProductCard';
import { IProductCard } from '../ProductCard/ProductCard';

interface IProps {
	title: string;
	isTint?: boolean;
	products: IProductCard[]
}

const ProductList = ({ title, products, isTint = true, }: IProps) => {
	const navigate = useNavigate();
	return (
		<Styled.Container isTint={isTint}>
			<Box sx={{ width: '80%' }}>
				<Box sx={{ width: '85%', my: 1, pt: `${isTint ? 2 : 0}`, mx: 'auto' }}>
					<Divider sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
						{title}
					</Divider>
				</Box>
				<Styled.ProductContainerWrapper>
					{products.map((product) => (
						<ProductCard
							key={product.id}
							id={product.id}
							title={product.title}
							price={product.price}
							image={product.image}
							tags={product.tags}
							onClick={() => navigate(`/product/${product?.id}`)}
						/>
					))}
				</Styled.ProductContainerWrapper>
			</Box>
		</Styled.Container>
	);
};

export default ProductList;
