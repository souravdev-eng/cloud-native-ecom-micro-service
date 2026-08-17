/* ============================================================================
 * Shared visual primitives for the user MFE's account pages.
 * ============================================================================
 * CartPage/CheckoutPage each carry their own style module; the pages added
 * later (orders, order detail, profile, forgot/reset password) all want the
 * same card, badge, button and alert, so those live here instead of being
 * copied five times. Palette matches CartPage.style.tsx.
 * ========================================================================== */

import { styled, Typography, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { ORDER_STATUS_COLOR } from '../utils/money';

export const Page = styled('div')({
	minHeight: '100vh',
	backgroundColor: '#fafafa',
	paddingBottom: 60,
});

export const Content = styled('div')({
	maxWidth: 1200,
	margin: '0 auto',
	padding: '28px 20px 0',
});

/** Single-column container for the auth/profile forms. */
export const Narrow = styled('div')({
	maxWidth: 520,
	margin: '0 auto',
	padding: '28px 20px 0',
});

export const Card = styled('div')({
	backgroundColor: '#fff',
	borderRadius: 12,
	padding: 24,
	boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
});

export const SectionTitle = styled(Typography)({
	fontSize: 18,
	fontWeight: 600,
	color: '#1a1a2e',
	marginBottom: 16,
	fontFamily: '"Playfair Display", serif',
});

export const Row = styled('div')<{ isTotal?: boolean }>(({ isTotal }) => ({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	gap: 16,
	padding: isTotal ? '16px 0 0' : '10px 0',
	borderTop: isTotal ? '2px solid #1a1a2e' : 'none',
	marginTop: isTotal ? 12 : 0,
}));

export const Label = styled(Typography)<{ isTotal?: boolean }>(({ isTotal }) => ({
	fontSize: isTotal ? 16 : 14,
	fontWeight: isTotal ? 600 : 400,
	color: isTotal ? '#1a1a2e' : '#495057',
}));

export const Value = styled(Typography)<{ isTotal?: boolean }>(({ isTotal }) => ({
	fontSize: isTotal ? 22 : 14,
	fontWeight: isTotal ? 700 : 500,
	color: '#1a1a2e',
	textAlign: 'right',
	wordBreak: 'break-all',
}));

/** Monospace for ids / payment-intent refs so they're easy to copy-compare. */
export const Mono = styled('span')({
	fontFamily: '"SFMono-Regular", Menlo, Consolas, monospace',
	fontSize: 13,
	color: '#495057',
});

export const StatusBadge = styled('span')<{ status: string }>(({ status }) => {
	const color = ORDER_STATUS_COLOR[status] ?? { bg: '#f1f3f5', fg: '#495057' };
	return {
		display: 'inline-flex',
		alignItems: 'center',
		padding: '4px 12px',
		borderRadius: 999,
		fontSize: 12,
		fontWeight: 600,
		letterSpacing: '0.02em',
		backgroundColor: color.bg,
		color: color.fg,
		whiteSpace: 'nowrap',
	};
});

export const PrimaryButton = styled('button')({
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: 8,
	padding: '14px 24px',
	backgroundColor: '#1a1a2e',
	border: 'none',
	borderRadius: 10,
	fontSize: 15,
	fontWeight: 600,
	color: '#fff',
	cursor: 'pointer',
	transition: 'all 0.2s ease',
	'&:hover': {
		backgroundColor: '#2d2d44',
		transform: 'translateY(-1px)',
	},
	'&:disabled': {
		backgroundColor: '#adb5bd',
		cursor: 'not-allowed',
		transform: 'none',
	},
});

export const SecondaryButton = styled('button')({
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: 8,
	padding: '12px 20px',
	backgroundColor: '#fff',
	border: '1px solid #dee2e6',
	borderRadius: 10,
	fontSize: 14,
	fontWeight: 500,
	color: '#495057',
	cursor: 'pointer',
	transition: 'all 0.2s ease',
	'&:hover': {
		backgroundColor: '#f8f9fa',
		borderColor: '#adb5bd',
	},
	'&:disabled': {
		color: '#adb5bd',
		cursor: 'not-allowed',
	},
});

export const DangerButton = styled(SecondaryButton)({
	color: '#c92a2a',
	borderColor: '#ffc9c9',
	'&:hover': {
		backgroundColor: '#fff5f5',
		borderColor: '#ff8787',
	},
});

export const LinkButton = styled(RouterLink)({
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: 8,
	padding: '14px 28px',
	backgroundColor: '#1a1a2e',
	borderRadius: 10,
	fontSize: 14,
	fontWeight: 600,
	color: '#fff',
	textDecoration: 'none',
	transition: 'all 0.2s ease',
	'&:hover': {
		backgroundColor: '#2d2d44',
		transform: 'translateY(-1px)',
	},
});

export const TextLink = styled(RouterLink)({
	color: '#1971c2',
	fontSize: 14,
	fontWeight: 600,
	textDecoration: 'none',
	'&:hover': { textDecoration: 'underline' },
});

export const ButtonRow = styled('div')({
	display: 'flex',
	gap: 12,
	flexWrap: 'wrap',
	marginTop: 20,
});

type AlertVariant = 'error' | 'success' | 'info';

const ALERT_COLORS: Record<AlertVariant, { bg: string; fg: string; border: string }> = {
	error: { bg: '#fff5f5', fg: '#c92a2a', border: '#ffc9c9' },
	success: { bg: '#e6fcf5', fg: '#087f5b', border: '#96f2d7' },
	info: { bg: '#e7f5ff', fg: '#1864ab', border: '#a5d8ff' },
};

export const Alert = styled('div')<{ variant?: AlertVariant }>(
	({ variant = 'error' }) => {
		const color = ALERT_COLORS[variant];
		return {
			display: 'flex',
			alignItems: 'flex-start',
			gap: 10,
			padding: '12px 16px',
			borderRadius: 10,
			border: `1px solid ${color.border}`,
			backgroundColor: color.bg,
			color: color.fg,
			fontSize: 14,
			lineHeight: 1.5,
			marginBottom: 20,
		};
	},
);

/* ---- Forms ------------------------------------------------------------- */

export const Field = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	gap: 6,
	marginBottom: 18,
});

export const FieldLabel = styled('label')({
	fontSize: 13,
	fontWeight: 600,
	color: '#495057',
});

export const TextInput = styled('input')({
	width: '100%',
	padding: '12px 14px',
	border: '1px solid #dee2e6',
	borderRadius: 8,
	fontSize: 14,
	color: '#1a1a2e',
	outline: 'none',
	transition: 'border-color 0.2s ease',
	'&:focus': { borderColor: '#1a1a2e' },
	'&::placeholder': { color: '#adb5bd' },
	'&:disabled': { backgroundColor: '#f8f9fa', color: '#868e96' },
});

export const FieldHint = styled(Typography)({
	fontSize: 12,
	color: '#868e96',
});

/* ---- States ------------------------------------------------------------ */

export const LoadingContainer = styled('div')({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: '50vh',
});

export const EmptyState = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	textAlign: 'center',
	padding: '64px 40px',
	backgroundColor: '#fff',
	borderRadius: 12,
	boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
});

export const EmptyTitle = styled(Typography)({
	fontSize: 22,
	fontWeight: 600,
	color: '#1a1a2e',
	marginTop: 16,
	marginBottom: 8,
	fontFamily: '"Playfair Display", serif',
});

export const EmptyText = styled(Typography)({
	fontSize: 14,
	color: '#868e96',
	marginBottom: 24,
	maxWidth: 420,
});

export const CloseButton = styled(IconButton)({
	padding: 4,
	marginLeft: 'auto',
	color: 'inherit',
});
