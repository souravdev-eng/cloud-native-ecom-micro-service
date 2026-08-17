import { CircularProgress } from '@mui/material';

import * as Styled from './SignInPage.style';
import { useSignIn } from './SignIn.hook';

const SignInPage = () => {
	const { formData, loading, error, handleFieldChange, handleSignIn } = useSignIn();

	return (
		<Styled.Container>
			{/* onSubmit on the form (not onClick on the button) so Enter submits
			    instead of triggering a native page reload. */}
			<Styled.Form onSubmit={handleSignIn}>
				{error && <Styled.ErrorText>{error}</Styled.ErrorText>}
				<Styled.Input
					name="email"
					type="email"
					placeholder="Email"
					autoComplete="email"
					value={formData.email}
					onChange={handleFieldChange}
				/>
				<Styled.Input
					name="password"
					type="password"
					placeholder="Password"
					autoComplete="current-password"
					value={formData.password}
					onChange={handleFieldChange}
				/>
				<Styled.HelperRow>
					<Styled.Link to="/user/auth/forgot-password">Forgot password?</Styled.Link>
				</Styled.HelperRow>
				<Styled.Button type="submit" disabled={loading}>
					{loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Sign In'}
				</Styled.Button>
				<Styled.DontHaveAccount>
					Don't have an account?
					<Styled.Link to="/user/auth/signup">Sign Up</Styled.Link>
				</Styled.DontHaveAccount>
			</Styled.Form>
		</Styled.Container>
	);
};

export default SignInPage;
