import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AuthRouter = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' height='100vh'>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to='/' replace />;
  } else {
    return <Outlet />;
  }
};

export default AuthRouter;
