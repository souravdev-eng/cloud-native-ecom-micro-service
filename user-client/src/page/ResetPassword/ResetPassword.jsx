import axios from 'axios';
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { Button, Link, TextField, Typography } from '@mui/material';
import { BASE_URL } from '../../api/baseUrl';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const location = useLocation();

  const handleResetPassword = async () => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const email = searchParams.get('email');
      const token = searchParams.get('token');
      console.log({ token, email });
      const response = await axios.put(
        `${BASE_URL}/users/reset-password`,
        { newPassword: password },
        {
          params: { email, token },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (response?.data) {
        navigate('/auth/login');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
      <Typography variant='h4' gutterBottom>
        Reset your password
      </Typography>

      <TextField
        label='Password'
        variant='outlined'
        type='password'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ margin: '10px 0px', width: '300px' }}
      />

      <Button
        onClick={handleResetPassword}
        variant='contained'
        style={{
          width: '300px',
          height: 50,
          borderRadius: 12,
          marginTop: '20px',
          backgroundColor: '#1976d2',
          color: '#fff',
        }}>
        Update Password
      </Button>

      <div style={{ marginTop: '20px' }}>
        <Link
          component={RouterLink}
          to='/auth/login'
          style={{ color: '#1976d2', textDecoration: 'none' }}>
          Already have an account? Login
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
