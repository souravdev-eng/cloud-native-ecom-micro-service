import { createBrowserRouter, RouterProvider, Outlet, Link } from 'react-router-dom';

import UserModule from './modules/UserModule';
import DashboardModule from './modules/DashboardModule';

const Layout = () => {
  return (
    <div className='app'>
      <nav>
        <Link to='/'>Home</Link>
        <Link to='/user/auth/signin'>Login</Link>
        <Link to='/user/profile'>Profile</Link>
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

      // Auth micro frontend routes - catch all user-related paths
      {
        path: 'user/*',
        element: <UserModule />,
      },
    ],
  },
  {
    path: '*',
    element: <div>404 - Page Not Found</div>,
  },
]);

export default router;
