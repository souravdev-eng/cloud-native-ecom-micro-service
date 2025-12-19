import { Box, styled, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export const Container = styled(Box)({
	// backgroundColor: 'pink',
	marginBottom: 10,
});

export const CouponContainer = styled(Box)({
	backgroundColor: '#0088CC',
	display: 'flex',
	justifyContent: 'center',
	height: 60,
	alignItems: 'center',
	gap: 10,
});

export const SubHeaderContainer = styled(Box)({
	display: 'flex',
	justifyContent: 'space-around',
	padding: '20px 0px',
});

export const MenuItemLink = styled(Link)({
	fontSize: 12,
	color: '#868e96',
	fontWeight: 700,
});

export const SubHeaderTitle = styled(Typography)({
	fontSize: 12,
	color: '#495057',
	fontWeight: 700,
});
