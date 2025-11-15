import { Box, Typography } from '@mui/material';
import * as Styles from './SignUp.styles';
// import { Link } from 'react-router-dom';

const SignUp = () => {
  return (
    <Styles.Container>
      <Styles.Wrapper>
        <Typography variant='h4' fontWeight={600} fontSize={24} textAlign='left' marginBottom={2}>Sign Up</Typography>
        <Box>
          <Styles.Input placeholder='Name' />
        </Box>
        <Box>
          <Styles.Input placeholder='Email' />
        </Box>
        <Box>
          <Styles.Input placeholder='Password' />
        </Box>
        <Box>
          <Styles.Input placeholder='Confirm Password' />
        </Box>
        <Box>
          <Styles.Button variant='contained' loading={false}>Sign up</Styles.Button>
        </Box>
        <Box>
          <Typography variant='body1' fontSize={14} textAlign='center'>Already have an account? <Styles.Link href='/signin'>Sign in</Styles.Link></Typography>
        </Box>
      </Styles.Wrapper>
    </Styles.Container>
  );
};

export default SignUp;
