import { styled } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const Container = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	height: '100vh',
	width: '100vw',
	backgroundColor: '#f0f0f0',
	margin: '0 auto',
});

export const Form = styled('form')({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	height: '100vh',
	gap: 12,
	width: 400,
});

export const Input = styled('input')({
	width: '100%',
	height: 40,
	borderRadius: 6,
	border: '1px solid #ccc',
	padding: '4px 12px',
});

export const Button = styled('button')({
	width: 400,
	height: 50,
	borderRadius: 6,
	backgroundColor: '#212529',
	color: '#fff',
	fontWeight: 400,
	fontSize: 16,
	cursor: 'pointer',
	marginTop: 12,
});

export const Link = styled(RouterLink)({
	color: '#0075AF',
	textDecoration: 'none',
	fontSize: 14,
	fontWeight: 600,
	marginLeft: 4,
});

export const DontHaveAccount = styled('span')({
	fontSize: 14,
	color: '#212529',
	fontWeight: 400,
});
