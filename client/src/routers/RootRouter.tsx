import { createBrowserRouter } from 'react-router-dom';
import AuthRouter from './AuthRouter';
import ProtectedRoute from './ProtectedRoute';
import Layout from './Layout';
import SignUp from '../pages/SignUp/SignUp';
import Login from '../pages/Login/Login';
import HomePage from '../pages/Home/Home';
import ProductDetails from '../pages/ProductDetails/ProductDetails';
import Cart from '../pages/Cart/Cart';
import Checkout from '../pages/Checkout/Checkout';

const rootRouter = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'product/:id',
        element: <ProductDetails />,
      },
      {
        path: 'cart',
        element: <Cart />,
      },
      {
        path: 'checkout',
        element: <Checkout />,
      },
    ],
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