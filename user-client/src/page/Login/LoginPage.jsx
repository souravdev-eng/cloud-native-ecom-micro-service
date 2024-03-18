import axios from 'axios';
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Button, Link, TextField, Typography } from '@mui/material';
import { BASE_URL } from '../../api/baseUrl';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/users/login`,
        {
          email: email,
          password: password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.data) {
        navigate('/');
      }
    } catch (error) {
      console.log(error);
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
        Login to your account
      </Typography>

      <TextField
        label='Email'
        variant='outlined'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ margin: '10px 0px', width: '300px' }}
      />

      <TextField
        label='Password'
        variant='outlined'
        type='password'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ margin: '10px 0px', width: '300px' }}
      />

      <Button
        onClick={handleLogin}
        variant='contained'
        style={{
          width: '300px',
          height: 50,
          borderRadius: 12,
          marginTop: '20px',
          backgroundColor: '#1976d2',
          color: '#fff',
        }}>
        LogIn
      </Button>

      <div style={{ marginTop: '20px' }}>
        <Link
          component={RouterLink}
          to='/auth/signup'
          style={{ color: '#1976d2', textDecoration: 'none' }}>
          Don't have an account? Sign Up
        </Link>
      </div>
    </div>
  );
};

export default Login;
