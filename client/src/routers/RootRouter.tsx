import { createBrowserRouter } from 'react-router-dom';
import AuthRouter from './AuthRouter';
import ProtectedRoute from './ProtectedRoute';
import SignUp from '../pages/SignUp/SignUp';
import Login from '../pages/Login/Login';

const rootRouter = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <div>Hello World</div>
      </ProtectedRoute>
    ),
  },
  {
    path: '/product',
    element: (
      <ProtectedRoute>
        <div>Product</div>
      </ProtectedRoute>
    ),
  },
  {
    path: '/auth',
    element: <AuthRouter />,
    children: [
      {
        path: '/auth/login',
        element: <Login />,
      },
      {
        path: '/auth/signup',
        element: <SignUp />,
      },
    ],
  },
  {
    path: '*',
    element: <div>404 - Page Not Found</div>,
  },
]);

export default rootRouter;
