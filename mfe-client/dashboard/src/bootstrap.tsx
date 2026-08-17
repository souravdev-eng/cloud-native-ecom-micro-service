import ReactDomClient from 'react-dom/client';
import { createBrowserRouter, createMemoryRouter, RouterProvider } from 'react-router-dom';

import App from './App';

interface RemoteLocation {
	pathname: string;
	search?: string;
}

interface MountOptions {
	onNavigation?: (location: RemoteLocation) => void;
	defaultRouter?: any;
	/** Full path INCLUDING any query string, e.g. `/products?search=phone`. */
	initialPath?: string;
}

const mount = (
	el: any,
	{ onNavigation, defaultRouter, initialPath }: MountOptions,
) => {
	const router =
		defaultRouter ||
		createMemoryRouter(
			[
				{
					path: '*',
					element: <App />,
				},
			],
			{
				// The whole href, not just the pathname — ProductsPage reads
				// ?search= and ?category= off the query string.
				initialEntries: [initialPath || '/'],
				initialIndex: 0,
			},
		);

	if (onNavigation && router.subscribe) {
		router.subscribe((state: any) => {
			onNavigation({
				pathname: state.location.pathname,
				search: state.location.search,
			});
		});
	}

	const root = ReactDomClient.createRoot(el);
	root.render(<RouterProvider router={router} />);

	return {
		onParentNavigate: (location: RemoteLocation): void => {
			const current = router.state?.location;
			const currentHref = `${current?.pathname ?? ''}${current?.search ?? ''}`;
			const nextHref = `${location.pathname}${location.search ?? ''}`;
			if (currentHref !== nextHref) {
				router.navigate(nextHref);
			}
		},
	};
};

if (process.env.NODE_ENV === 'development') {
	const devRoot = document.querySelector('#_dashboard-dev-root');
	if (devRoot) {
		const browserRouter = createBrowserRouter([
			{
				path: '*',
				element: <App />,
			},
		]);
		mount(devRoot, { defaultRouter: browserRouter });
	}
}

export { mount };
