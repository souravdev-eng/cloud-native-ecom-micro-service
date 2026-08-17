import { styled, Typography } from '@mui/material';
import { NavLink, Link as RouterLink } from 'react-router-dom';

export const Bar = styled('div')({
	backgroundColor: '#fff',
	borderBottom: '1px solid #e9ecef',
	position: 'sticky',
	top: 0,
	zIndex: 20,
});

export const Inner = styled('div')({
	maxWidth: 1200,
	margin: '0 auto',
	display: 'flex',
	alignItems: 'center',
	gap: 24,
	padding: '0 20px',
	height: 58,
	'@media (max-width: 640px)': {
		gap: 14,
		overflowX: 'auto',
	},
});

export const Logo = styled(RouterLink)({
	fontFamily: '"Playfair Display", serif',
	fontSize: 22,
	fontWeight: 700,
	color: '#1a1a2e',
	textDecoration: 'none',
	letterSpacing: '-0.5px',
	flexShrink: 0,
	'& span': {
		color: '#868e96',
		fontWeight: 400,
	},
});

export const Links = styled('nav')({
	display: 'flex',
	alignItems: 'center',
	gap: 4,
	marginLeft: 'auto',
});

export const Item = styled(NavLink)({
	padding: '8px 14px',
	borderRadius: 8,
	fontSize: 14,
	fontWeight: 500,
	color: '#495057',
	textDecoration: 'none',
	whiteSpace: 'nowrap',
	transition: 'all 0.15s ease',
	'&:hover': {
		backgroundColor: '#f8f9fa',
		color: '#1a1a2e',
	},
	'&.active': {
		backgroundColor: '#1a1a2e',
		color: '#fff',
	},
});

export const Header = styled('div')({
	maxWidth: 1200,
	margin: '0 auto',
	display: 'flex',
	alignItems: 'center',
	gap: 16,
	padding: '32px 20px 0',
});

export const BackButton = styled('button')({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: 42,
	height: 42,
	borderRadius: '50%',
	border: 'none',
	backgroundColor: '#fff',
	color: '#1a1a2e',
	cursor: 'pointer',
	boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
	transition: 'all 0.2s ease',
	flexShrink: 0,
	'&:hover': {
		backgroundColor: '#1a1a2e',
		color: '#fff',
		transform: 'translateX(-2px)',
	},
});

export const Title = styled(Typography)({
	fontSize: 28,
	fontWeight: 600,
	color: '#1a1a2e',
	fontFamily: '"Playfair Display", serif',
});

export const Subtitle = styled(Typography)({
	maxWidth: 1200,
	margin: '0 auto',
	padding: '4px 20px 0',
	fontSize: 14,
	color: '#868e96',
});
