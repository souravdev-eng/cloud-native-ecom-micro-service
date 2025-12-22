import { useNavigate } from 'react-router-dom';

import * as Styled from './SignupPage.style';
import { useSignUp } from './SignUp.hooks';

const SignupPage = () => {
	const navigate = useNavigate();
	const { handleSignUp } = useSignUp();

	// const handleSignUp = () => {
	// 	navigate('/');
	// };

	return (
		<Styled.Container>
			<Styled.Form>
				<Styled.Input type="text" placeholder="Name" />
				<Styled.Input type="email" placeholder="Email" />
				<Styled.Input type="password" placeholder="Password" />
				<Styled.Input type="password" placeholder="Confirm Password" />
				<Styled.Button type="submit" onClick={(e: any) => handleSignUp(e)}>
					Sign Up
				</Styled.Button>
				<Styled.DontHaveAccount>
					Don't have an account?
					<Styled.Link to="/user/auth/signin">Sign In</Styled.Link>
				</Styled.DontHaveAccount>
			</Styled.Form>
		</Styled.Container>
	);
};

export default SignupPage;
