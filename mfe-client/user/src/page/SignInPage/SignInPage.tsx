import { CircularProgress } from '@mui/material';
import * as Styled from './SignInPage.style';
import { useSignIn } from './SignIn.hook';

const SignupPage = () => {
	const { formData, loading, error, handleFieldChange, handleSignIn } = useSignIn();

	return (
		<Styled.Container>
			<Styled.Form>
				<Styled.Input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleFieldChange} />
				<Styled.Input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleFieldChange} />
				<Styled.Button type="submit" onClick={(e: any) => handleSignIn(e)} disabled={loading}>
					{loading ? <CircularProgress size={20} /> : 'Sign In'}
				</Styled.Button>
				<Styled.DontHaveAccount>
					Don't have an account?
					<Styled.Link to="/user/auth/signup">Sign Up</Styled.Link>
				</Styled.DontHaveAccount>
			</Styled.Form>
		</Styled.Container>
	);
};

export default SignupPage;
