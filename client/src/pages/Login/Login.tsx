import { Box, Typography } from '@mui/material';
import * as Styles from './Login.styles';
import { useLogin } from './Login.hooks';

const Login = () => {
  const { formData, loading, error, handleFieldChange, handleLogin } = useLogin();
  return (
    <Styles.Container>
      <Styles.Wrapper>
        <Typography variant='h4' fontWeight={600} fontSize={24} textAlign='left' marginBottom={2}>Login</Typography>
        <Box>
          <Styles.Input placeholder='Email' name='email' value={formData.email} onChange={handleFieldChange} />
        </Box>
        <Box>
          <Styles.Input placeholder='Password' name='password' type='password' value={formData.password} onChange={handleFieldChange} />
        </Box>
        <Box>
          <Styles.Button variant='contained' loading={loading} onClick={handleLogin} disabled={loading}>Login</Styles.Button>
        </Box>
        <Box>
          {error && <Typography variant='body1' fontSize={14} textAlign='center' color='red'>{error}</Typography>}
        </Box>
        <Box>
          <Typography variant='body1' fontSize={14} textAlign='center'>
            Don't have an account?{' '}
            <Styles.Link to='/auth/signup'>
              Sign up
            </Styles.Link>
          </Typography>
        </Box>
      </Styles.Wrapper>
    </Styles.Container>
  );
};

export default Login;
