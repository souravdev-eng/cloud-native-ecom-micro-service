import { createBrowserRouter, Link, Outlet } from 'react-router-dom';

import DashboardModule from './modules/DashboardModule';
import UserModule from './modules/UserModule';
import AdminModule from './modules/AdminModule';

const Layout = () => {
	return (
		<div className="app">
			<nav>
				<Link to="/">Home</Link>
				<Link to="/user/auth/signin">Login</Link>
				<Link to="/user/profile">Profile</Link>
			</nav>
			<main>
				<Outlet />
			</main>
		</div>
	);
};

const router = createBrowserRouter([
	{
		path: '/',
		// element: <Layout />,
		children: [
			{
				index: true,
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
				path: 'admin/*',
				element: <AdminModule />,
			},
		],
	},
	{
		path: '*',
		element: <div>404 - Page Not Found</div>,
	},
]);

export default router;
