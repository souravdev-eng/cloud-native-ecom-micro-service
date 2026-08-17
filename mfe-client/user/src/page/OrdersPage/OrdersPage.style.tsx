import { styled, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const List = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	gap: 16,
});

export const OrderCard = styled(RouterLink)({
	display: 'block',
	backgroundColor: '#fff',
	borderRadius: 12,
	padding: 20,
	textDecoration: 'none',
	boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
	transition: 'box-shadow 0.2s ease, transform 0.2s ease',
	'&:hover': {
		boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
		transform: 'translateY(-2px)',
	},
});

export const CardTop = styled('div')({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: 16,
	flexWrap: 'wrap',
	marginBottom: 16,
	paddingBottom: 16,
	borderBottom: '1px solid #f1f3f5',
});

export const OrderRef = styled(Typography)({
	fontSize: 15,
	fontWeight: 600,
	color: '#1a1a2e',
	fontFamily: '"SFMono-Regular", Menlo, Consolas, monospace',
});

export const OrderDate = styled(Typography)({
	fontSize: 13,
	color: '#868e96',
	marginTop: 2,
});

export const CardBottom = styled('div')({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: 16,
	flexWrap: 'wrap',
});

export const Thumbs = styled('div')({
	display: 'flex',
	alignItems: 'center',
	gap: 8,
});

export const Thumb = styled('img')({
	width: 52,
	height: 52,
	objectFit: 'contain',
	borderRadius: 8,
	backgroundColor: '#f8f9fa',
	border: '1px solid #f1f3f5',
});

export const MoreThumbs = styled('div')({
	width: 52,
	height: 52,
	borderRadius: 8,
	backgroundColor: '#f8f9fa',
	border: '1px dashed #dee2e6',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	fontSize: 13,
	fontWeight: 600,
	color: '#868e96',
});

export const AmountBlock = styled('div')({
	textAlign: 'right',
	marginLeft: 'auto',
});

export const AmountLabel = styled(Typography)({
	fontSize: 12,
	color: '#868e96',
});

export const Amount = styled(Typography)({
	fontSize: 20,
	fontWeight: 700,
	color: '#1a1a2e',
});

export const ItemSummary = styled(Typography)({
	fontSize: 13,
	color: '#495057',
});

export const Pagination = styled('div')({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: 16,
	marginTop: 28,
});

export const PageInfo = styled(Typography)({
	fontSize: 13,
	color: '#868e96',
});
