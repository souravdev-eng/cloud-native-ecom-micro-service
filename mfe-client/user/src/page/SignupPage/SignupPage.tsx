import { CircularProgress } from '@mui/material';

import * as Styled from './SignupPage.style';
import { useSignUp } from './SignUp.hooks';

const SignupPage = () => {
	const { formData, loading, error, handleFieldChange, handleSignUp } = useSignUp();

	return (
		<Styled.Container>
			{/* The `name` attributes must match the signup body the auth service
			    validates: name, email, password, passwordConform. */}
			<Styled.Form onSubmit={handleSignUp}>
				{error && <Styled.ErrorText>{error}</Styled.ErrorText>}
				<Styled.Input
					name="name"
					type="text"
					placeholder="Name"
					autoComplete="name"
					value={formData.name}
					onChange={handleFieldChange}
				/>
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
					placeholder="Password (min 6 characters)"
					autoComplete="new-password"
					value={formData.password}
					onChange={handleFieldChange}
				/>
				<Styled.Input
					name="passwordConform"
					type="password"
					placeholder="Confirm Password"
					autoComplete="new-password"
					value={formData.passwordConform}
					onChange={handleFieldChange}
				/>
				<Styled.Button type="submit" disabled={loading}>
					{loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Sign Up'}
				</Styled.Button>
				<Styled.DontHaveAccount>
					Already have an account?
					<Styled.Link to="/user/auth/signin">Sign In</Styled.Link>
				</Styled.DontHaveAccount>
			</Styled.Form>
		</Styled.Container>
	);
};

export default SignupPage;
