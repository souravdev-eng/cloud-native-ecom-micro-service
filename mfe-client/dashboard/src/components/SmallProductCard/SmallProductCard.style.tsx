import { Box, styled } from '@mui/material';

export const Container = styled(Box)({
	display: 'flex',
	width: '100%',
	height: '100%',
	overflow: 'hidden',
	cursor: 'pointer',
});

export const Image = styled('img')({
	width: '80px',
	height: '80px',
	objectFit: 'cover',
});
