import { styled, Typography } from '@mui/material';

export const Layout = styled('div')({
	display: 'grid',
	gridTemplateColumns: '1fr 360px',
	gap: 24,
	alignItems: 'start',
	'@media (max-width: 900px)': {
		gridTemplateColumns: '1fr',
	},
});

export const StatusHeader = styled('div')({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: 16,
	flexWrap: 'wrap',
	marginBottom: 20,
});

export const ItemRow = styled('div')({
	display: 'flex',
	alignItems: 'center',
	gap: 16,
	padding: '14px 0',
	borderBottom: '1px solid #f1f3f5',
	'&:last-of-type': {
		borderBottom: 'none',
	},
});

export const ItemImage = styled('img')({
	width: 72,
	height: 72,
	objectFit: 'contain',
	borderRadius: 8,
	backgroundColor: '#f8f9fa',
	border: '1px solid #f1f3f5',
	flexShrink: 0,
});

export const ItemInfo = styled('div')({
	flex: 1,
	minWidth: 0,
});

export const ItemTitle = styled(Typography)({
	fontSize: 15,
	fontWeight: 500,
	color: '#1a1a2e',
});

export const ItemMeta = styled(Typography)({
	fontSize: 13,
	color: '#868e96',
	marginTop: 2,
});

export const ItemTotal = styled(Typography)({
	fontSize: 16,
	fontWeight: 600,
	color: '#1a1a2e',
	whiteSpace: 'nowrap',
});

export const CardFormWrapper = styled('div')({
	marginTop: 20,
	paddingTop: 20,
	borderTop: '1px solid #f1f3f5',
});

export const CardElementWrapper = styled('div')({
	padding: '14px 16px',
	border: '1px solid #dee2e6',
	borderRadius: 8,
	backgroundColor: '#fff',
	marginBottom: 16,
});

/** Raw API fields — handy to eyeball while the order endpoints are in flux. */
export const MetaCard = styled('div')({
	backgroundColor: '#fff',
	borderRadius: 12,
	padding: 20,
	boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
	marginTop: 20,
});
