import { styled } from '@mui/material';

export const Container = styled('div')({
	display: 'flex',
	gap: 12,
	// width: '70%',
	justifyContent: 'center',
	// alignItems: 'center',
	padding: 20,
	margin: '0 auto',
});

export const ProductImageContainer = styled('div')({
	borderRadius: 12,
	overflow: 'hidden',
	objectPosition: 'center',
});

export const ProductDetailsContainer = styled('div')({
	width: '40%',
});

export const ProductImage = styled('img')({
	width: 400,
	height: 300,
	objectFit: 'contain',
	borderRadius: 12,
	objectPosition: 'center',
});

export const ProductTitle = styled('h1')({
	fontSize: 24,
	fontWeight: 600,
});

export const ProductPrice = styled('p')({
	fontSize: 20,
	fontWeight: 600,
});

export const ProductDescription = styled('p')({
	fontSize: 16,
	fontWeight: 400,
});

export const AddToCartButton = styled('button')({
	fontSize: 16,
	fontWeight: 600,
	backgroundColor: '#212529',
	color: '#fff',
	padding: 10,
	borderRadius: 6,
	cursor: 'pointer',
	width: 200,
	marginTop: 12,
});
