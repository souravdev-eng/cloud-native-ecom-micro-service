import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { useNavigate } from 'react-router-dom';

import * as Styled from './ProductList.style';

import ProductCard from '../ProductCard/ProductCard';

interface IProps {
	title: string;
	isTint?: boolean;
}

const ProductList = ({ title, isTint = true }: IProps) => {
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
					{Array.from({ length: 4 }).map((_, index) => (
						<ProductCard
							key={index}
							onClick={() => navigate(`/product/${index}`)}
						/>
					))}
				</Styled.ProductContainerWrapper>
			</Box>
		</Styled.Container>
	);
};

export default ProductList;
