import { createBrowserRouter } from 'react-router-dom';

import DashboardModule from './modules/DashboardModule';
import UserModule from './modules/UserModule';
import AdminModule from './modules/AdminModule';

/**
 * Path → remote mapping for the shell.
 *
 * Each remote owns its own <Routes> internally, so the shell only needs to
 * decide which one to mount. There is intentionally no shared nav element here:
 * the storefront chrome lives in the dashboard remote's Header, and the account
 * pages carry their own PageNav.
 */
const router = createBrowserRouter([
	{
		path: '/',
		children: [
			{
				index: true,
				element: <DashboardModule />,
			},
			{
				path: 'products',
				element: <DashboardModule />,
			},
			{
				path: 'product/*',
				element: <DashboardModule />,
			},
			{
				path: 'user/*',
				element: <UserModule />,
			},
			{
				// The auth service's password-reset email links to
				// /auth/reset-password?token=…&email= (not /user/auth/...), so that
				// prefix has to reach the user remote or the link 404s.
				path: 'auth/*',
				element: <UserModule />,
			},
			{
				path: 'admin/*',
				element: <AdminModule />,
			},
		],
	},
	{
		path: '*',
		element: <DashboardModule />,
	},
]);

export default router;
