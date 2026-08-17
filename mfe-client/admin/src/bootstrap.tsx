import React from 'react';
import { Provider } from 'react-redux'

import ReactDomClient from 'react-dom/client';
import {
	createBrowserRouter,
	createMemoryRouter,
	RouterProvider,
} from 'react-router-dom';

import App from './App';
import { store } from './store/store';

interface RemoteLocation {
	pathname: string;
	search?: string;
}

interface MountOptions {
	onNavigation?: (location: RemoteLocation) => void;
	defaultRouter?: any;
	/** Full path INCLUDING any query string. */
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

	// Set up navigation listener if provided. The search string travels too —
	// a memory router can't recover a query the shell dropped on the way in.
	if (onNavigation && router.subscribe) {
		router.subscribe((state: any) => {
			onNavigation({
				pathname: state.location.pathname,
				search: state.location.search,
			});
		});
	}

	const root = ReactDomClient.createRoot(el);
	root.render(
		<Provider store={store}>
			<RouterProvider router={router} />
		</Provider>
	);

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
// @ts-expect-error
if (process.env.NODE_ENV === 'development') {
	const devRoot = document.querySelector('#_admin-dev-root');
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
