import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import * as Styled from './SignInPage.style';

import { getAuthUrl } from '../../../../shared/src/config/apiConfig';

const SignupPage = () => {
	const navigate = useNavigate();

	const handleSignIn = async () => {
		const response = await axios.post(getAuthUrl('/login'), {
			email: 'souravmajumdar.developer@gmail.com',
			password: '123456',
		});
		console.log(response);
		// navigate('/');
	};

	return (
		<Styled.Container>
			<Styled.Form>
				<Styled.Input type="email" placeholder="Email" />
				<Styled.Input type="password" placeholder="Password" />
				<Styled.Button type="submit" onClick={handleSignIn}>
					Sign In
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
