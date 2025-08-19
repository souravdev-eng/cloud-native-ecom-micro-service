import { Route, Routes } from 'react-router-dom';

import SignInPage from './page/SignInPage/SignInPage';
import SignUpPage from './page/SignupPage/SignupPage';

const App = () => (
	<Routes>
		<Route path="/user/auth/signin" element={<SignInPage />} />
		<Route path="/user/auth/signup" element={<SignUpPage />} />
		<Route
			path="/user/auth/forgot-password"
			element={<div>Forgot Password</div>}
		/>
		<Route path="/user/profile" element={<div>User Profile</div>} />
		<Route path="*" element={<div>Auth page not found</div>} />
	</Routes>
);

export default App;
