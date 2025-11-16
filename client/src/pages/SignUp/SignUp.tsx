import { Box, Typography } from '@mui/material';
import * as Styles from './SignUp.styles';
import { useSignUp } from './SignUp.hooks';

const SignUp = () => {
  const { formData, loading, error, handleFieldChange, handleSignUp } = useSignUp();

  return (
    <Styles.Container>
      <Styles.Wrapper>
        <Typography variant='h4' fontWeight={600} fontSize={24} textAlign='left' marginBottom={2}>Sign Up</Typography>
        <Box>
          <Styles.Input placeholder='Name' name='name' value={formData.name} onChange={handleFieldChange} />
        </Box>
        <Box>
          <Styles.Input placeholder='Email' name='email' value={formData.email} onChange={handleFieldChange} />
        </Box>
        <Box>
          <Styles.Input placeholder='Password' name='password' value={formData.password} onChange={handleFieldChange} type='password' />
        </Box>
        <Box>
          <Styles.Input placeholder='Confirm Password' name='passwordConform' value={formData.passwordConform} onChange={handleFieldChange} type='password' />
        </Box>
        <Box>
          <Styles.Button variant='contained' loading={loading} onClick={handleSignUp} disabled={loading}>Sign up</Styles.Button>
        </Box>
        <Box>
          {error && <Typography variant='body1' fontSize={14} textAlign='center' color='red'>{error}</Typography>}
        </Box>
        <Box>
          <Typography variant='body1' fontSize={14} textAlign='center'>
            Already have an account?{' '}
            <Styles.Link to='/auth/login'>
              Sign in
            </Styles.Link>
          </Typography>
        </Box>
      </Styles.Wrapper>
    </Styles.Container>
  );
};

export default SignUp;
