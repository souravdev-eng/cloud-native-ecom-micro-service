import { Box, Typography, styled } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import ExploreOffIcon from '@mui/icons-material/ExploreOffRounded';

const Wrapper = styled(Box)({
	minHeight: '55vh',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	textAlign: 'center',
	gap: 10,
	padding: '60px 20px',
	backgroundColor: '#f8f9fa',
});

const Title = styled(Typography)({
	fontSize: 24,
	fontWeight: 700,
	color: '#212529',
});

const Text = styled(Typography)({
	fontSize: 14,
	color: '#868e96',
	marginBottom: 12,
});

const Path = styled('code')({
	fontFamily: '"SFMono-Regular", Menlo, Consolas, monospace',
	fontSize: 13,
	backgroundColor: '#f1f3f5',
	padding: '2px 6px',
	borderRadius: 4,
	color: '#495057',
});

const Actions = styled(Box)({
	display: 'flex',
	gap: 12,
	flexWrap: 'wrap',
	justifyContent: 'center',
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
	'&:hover': { backgroundColor: '#f8f9fa' },
});

/** Replaces the bare `<div>Page not found</div>` storefront fallback. */
const NotFound = () => {
	const navigate = useNavigate();
	const { pathname } = useLocation();

	return (
		<Wrapper>
			<ExploreOffIcon sx={{ fontSize: 64, color: '#dee2e6' }} />
			<Title>Page not found</Title>
			<Text>
				<Path>{pathname}</Path> doesn't match any page in the storefront.
			</Text>
			<Actions>
				<PrimaryBtn onClick={() => navigate('/products')}>Browse products</PrimaryBtn>
				<GhostBtn onClick={() => navigate('/')}>Go home</GhostBtn>
			</Actions>
		</Wrapper>
	);
};

export default NotFound;
