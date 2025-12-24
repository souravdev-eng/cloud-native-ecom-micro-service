import { Box, styled, Typography } from '@mui/material';

export const Container = styled('div')({
	display: 'flex',
	// border: '1px solid black',
	width: 300,
	flexDirection: 'column',
	paddingBottom: 8,
	justifyContent: 'center',
	alignItems: 'center',
	cursor: 'pointer',
	':hover': {
		backgroundColor: '#ffff',
		boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px',
		// box-shadow: ;
		borderRadius: 6,
	},
});

export const ProductImage = styled(`img`)({
	width: '100%',
	height: 280,
	aspectRatio: 1 / 1.2,
	objectFit: 'contain',
	objectPosition: 'center',
});

export const Button = styled('div')({
	cursor: 'pointer',
	backgroundColor: '#f1f3f5',
	color: '#868e96',
	padding: '10px 16px',
	marginTop: 12,
	textAlign: 'center',
	fontSize: 12,
	textTransform: 'uppercase',
	':hover': {
		backgroundColor: '#212529',
		color: '#fff',
	},
});

export const ProductTag = styled(Typography)({
	fontSize: '0.6rem',
	fontWeight: 400,
	color: '#868e96',
	textAlign: 'center',
	':hover': {
		color: '#228be6',
	},
});
export const ProductContent = styled('div')({
	width: '100%',
	padding: '0 12px',
	boxSizing: 'border-box',
});

export const ProductTitle = styled(Typography)({
	fontSize: 18,
	fontWeight: 400,
	color: '#343a40',
	textAlign: 'center',
	display: '-webkit-box',
	WebkitLineClamp: 2,
	WebkitBoxOrient: 'vertical',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	// lineHeight: 1.4,
	// minHeight: '2.8em',
	width: '100%',
	wordBreak: 'break-word',
});

export const ProductPrice = styled(Typography)({
	fontSize: 18,
	fontWeight: 600,
	color: '#343a40',
	textAlign: 'center',
	marginTop: 6,
});

export const SaleChip = styled(Box)({
	backgroundColor: '#d6336c',
	color: '#fff',
	borderRadius: '100px',
	width: '50px',
	position: 'absolute',
	top: '10px',
	left: '5px',
	zIndex: 100,
	textAlign: 'center',
});