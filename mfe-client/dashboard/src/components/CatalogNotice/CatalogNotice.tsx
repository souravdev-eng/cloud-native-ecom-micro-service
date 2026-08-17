import { Box, Typography, styled } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockPersonIcon from '@mui/icons-material/LockPersonRounded';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineRounded';

/* ============================================================================
 * Why the product grid is empty.
 * ============================================================================
 * The product service guards every route with `requireAuth`, so a signed-out
 * visitor gets 401s for the entire catalogue. Both the home page and the
 * products page used to swallow that and render an empty layout, which is
 * indistinguishable from "the database has no products" or "the port-forward is
 * down". This says which one it is.
 * ========================================================================== */

const Wrapper = styled(Box)({
	maxWidth: 720,
	margin: '48px auto',
	padding: '40px 32px',
	backgroundColor: '#fff',
	borderRadius: 16,
	border: '1px solid #f1f3f5',
	boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	textAlign: 'center',
	gap: 10,
});

const Title = styled(Typography)({
	fontSize: 22,
	fontWeight: 700,
	color: '#212529',
});

const Text = styled(Typography)({
	fontSize: 14,
	color: '#868e96',
	maxWidth: 460,
	lineHeight: 1.6,
});

const Actions = styled(Box)({
	display: 'flex',
	gap: 12,
	flexWrap: 'wrap',
	justifyContent: 'center',
	marginTop: 12,
});

const PrimaryBtn = styled('button')({
	padding: '12px 26px',
	borderRadius: 10,
	border: 'none',
	backgroundColor: '#212529',
	color: '#fff',
	fontSize: 14,
	fontWeight: 700,
	cursor: 'pointer',
	transition: 'background 0.18s',
	'&:hover': { backgroundColor: '#1a1a2e' },
});

const GhostBtn = styled('button')({
	padding: '12px 26px',
	borderRadius: 10,
	border: '1px solid #dee2e6',
	backgroundColor: '#fff',
	color: '#495057',
	fontSize: 14,
	fontWeight: 600,
	cursor: 'pointer',
	transition: 'background 0.18s',
	'&:hover': { backgroundColor: '#f8f9fa' },
});

interface CatalogNoticeProps {
	requiresAuth: boolean;
	message: string;
	onRetry?: () => void;
}

const CatalogNotice = ({ requiresAuth, message, onRetry }: CatalogNoticeProps) => {
	const navigate = useNavigate();

	if (requiresAuth) {
		return (
			<Wrapper>
				<LockPersonIcon sx={{ fontSize: 56, color: '#dee2e6' }} />
				<Title>Sign in to browse products</Title>
				<Text>
					The product catalogue is behind authentication, so there's nothing to show
					until you're signed in.
				</Text>
				<Actions>
					<PrimaryBtn
						onClick={() =>
							navigate(
								`/user/auth/signin?next=${encodeURIComponent(
									`${window.location.pathname}${window.location.search}`,
								)}`,
							)
						}
					>
						Sign in
					</PrimaryBtn>
					<GhostBtn onClick={() => navigate('/user/auth/signup')}>
						Create an account
					</GhostBtn>
				</Actions>
			</Wrapper>
		);
	}

	return (
		<Wrapper>
			<ErrorOutlineIcon sx={{ fontSize: 56, color: '#dee2e6' }} />
			<Title>Couldn't load products</Title>
			<Text>{message}</Text>
			<Actions>
				{onRetry ? (
					<PrimaryBtn onClick={onRetry}>Try again</PrimaryBtn>
				) : (
					<PrimaryBtn onClick={() => window.location.reload()}>Reload</PrimaryBtn>
				)}
			</Actions>
		</Wrapper>
	);
};

export default CatalogNotice;
