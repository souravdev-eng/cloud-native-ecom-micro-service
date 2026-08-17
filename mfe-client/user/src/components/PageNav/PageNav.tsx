import React from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import * as S from './PageNav.style';

const LINKS = [
	{ label: 'Shop', to: '/' },
	{ label: 'Cart', to: '/user/cart' },
	{ label: 'Orders', to: '/user/orders' },
	{ label: 'Profile', to: '/user/profile' },
];

interface PageNavProps {
	title: string;
	subtitle?: React.ReactNode;
	/** Where the back arrow goes. Omit the arrow entirely with `backTo={null}`. */
	backTo?: string | null;
}

/**
 * Nav + page heading for the account-area pages.
 *
 * The dashboard MFE owns the storefront `Header`, which the user MFE cannot
 * import across the federation boundary — so cart/orders/profile would
 * otherwise render with no way out but the browser back button.
 */
const PageNav = ({ title, subtitle, backTo = '/' }: PageNavProps) => {
	const navigate = useNavigate();

	return (
		<>
			<S.Bar>
				<S.Inner>
					<S.Logo to="/">
						E<span>com</span>
					</S.Logo>
					<S.Links>
						{LINKS.map((link) => (
							<S.Item key={link.to} to={link.to} end={link.to === '/'}>
								{link.label}
							</S.Item>
						))}
					</S.Links>
				</S.Inner>
			</S.Bar>

			<S.Header>
				{backTo !== null && (
					<S.BackButton onClick={() => navigate(backTo)} aria-label="Go back">
						<ArrowBackIcon />
					</S.BackButton>
				)}
				<S.Title>{title}</S.Title>
			</S.Header>
			{subtitle && <S.Subtitle>{subtitle}</S.Subtitle>}
		</>
	);
};

export default PageNav;
