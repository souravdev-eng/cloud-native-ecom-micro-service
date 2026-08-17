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

// Inline validation / API error. Both auth forms previously computed an error
// message and never rendered it, so a rejected login looked like a dead button.
export const ErrorText = styled('div')({
	width: '100%',
	padding: '10px 14px',
	borderRadius: 6,
	border: '1px solid #ffc9c9',
	backgroundColor: '#fff5f5',
	color: '#c92a2a',
	fontSize: 13,
	lineHeight: 1.4,
});

export const HelperRow = styled('div')({
	width: '100%',
	display: 'flex',
	justifyContent: 'flex-end',
});
