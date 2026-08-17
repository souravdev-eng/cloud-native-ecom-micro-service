import { useLocation } from 'react-router-dom';
import ExploreOffIcon from '@mui/icons-material/ExploreOff';

import PageNav from '../../components/PageNav/PageNav';
import * as C from '../../styles/common';

/**
 * Replaces the bare `<div>Auth page not found</div>` fallback, which gave no
 * way back and mislabelled every unmatched /user/* path as an auth page.
 */
const NotFoundPage = () => {
	const { pathname } = useLocation();

	return (
		<C.Page>
			<PageNav title="Page not found" />
			<C.Narrow>
				<C.EmptyState>
					<ExploreOffIcon sx={{ fontSize: 72, color: '#dee2e6' }} />
					<C.EmptyTitle>Nothing lives here</C.EmptyTitle>
					<C.EmptyText>
						<C.Mono>{pathname}</C.Mono> didn't match any route in the account area.
					</C.EmptyText>
					<C.ButtonRow>
						<C.LinkButton to="/">Back to the shop</C.LinkButton>
						<C.SecondaryButton onClick={() => window.history.back()}>
							Go back
						</C.SecondaryButton>
					</C.ButtonRow>
				</C.EmptyState>
			</C.Narrow>
		</C.Page>
	);
};

export default NotFoundPage;
