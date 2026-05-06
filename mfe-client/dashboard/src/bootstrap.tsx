import React from 'react';

import ReactDomClient from 'react-dom/client';
import {
	createBrowserRouter,
	createMemoryRouter,
	RouterProvider,
} from 'react-router-dom';

import App from './App';

interface MountOptions {
	onNavigation?: (location: { pathname: string }) => void;
	defaultRouter?: any;
	initialPath?: string;
}

const mount = (
	el: any,
	{ onNavigation, defaultRouter, initialPath }: MountOptions,
) => {
	// Create router based on environment or provided router
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
				initialEntries: [initialPath || '/'],
				initialIndex: 0,
			},
		);

	// Set up navigation listener if provided
	if (onNavigation && router.subscribe) {
		router.subscribe((state: any) => {
			onNavigation({ pathname: state.location.pathname });
		});
	}

	const root = ReactDomClient.createRoot(el);
	root.render(<RouterProvider router={router} />);

	return {
		onParentNavigate: (location: { pathname: string }): void => {
			const currentLocation = router.state?.location?.pathname;
			if (currentLocation !== location.pathname) {
				router.navigate(location.pathname);
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
