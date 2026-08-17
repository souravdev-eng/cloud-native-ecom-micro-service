import { CssBaseline, StyledEngineProvider } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';

import SignInPage from './page/SignInPage/SignInPage';
import SignUpPage from './page/SignupPage/SignupPage';
import ForgotPasswordPage from './page/ForgotPasswordPage/ForgotPasswordPage';
import ResetPasswordPage from './page/ResetPasswordPage/ResetPasswordPage';
import CartPage from './page/CartPage/CartPage';
import CheckoutPage from './page/CheckoutPage/CheckoutPage';
import OrdersPage from './page/OrdersPage/OrdersPage';
import OrderDetailsPage from './page/OrderDetailsPage/OrderDetailsPage';
import ProfilePage from './page/ProfilePage/ProfilePage';
import NotFoundPage from './page/NotFoundPage/NotFoundPage';

const App = () => (
	<StyledEngineProvider injectFirst>
		<CssBaseline />
		<Routes>
			{/* Auth */}
			<Route path="/user/auth/signin" element={<SignInPage />} />
			<Route path="/user/auth/signup" element={<SignUpPage />} />
			<Route path="/user/auth/forgot-password" element={<ForgotPasswordPage />} />
			<Route path="/user/auth/reset-password" element={<ResetPasswordPage />} />

			{/* The reset email links to /auth/reset-password?token=…&email=…
			    (auth/src/controllers/forgotPassword.ts), so that exact path has to
			    resolve. The host routes /auth/* here for it. */}
			<Route path="/auth/reset-password" element={<ResetPasswordPage />} />
			<Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

			{/* Shopping */}
			<Route path="/user/cart" element={<CartPage />} />
			<Route path="/user/checkout" element={<CheckoutPage />} />
			<Route path="/user/orders" element={<OrdersPage />} />
			<Route path="/user/orders/:id" element={<OrderDetailsPage />} />

			{/* Account */}
			<Route path="/user/profile" element={<ProfilePage />} />
			{/* Kept because older links (and the storefront header) used this path. */}
			<Route
				path="/user/my-account"
				element={<Navigate to="/user/profile" replace />}
			/>

			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	</StyledEngineProvider>
);

export default App;
