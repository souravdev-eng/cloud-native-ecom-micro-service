import axios from 'axios';
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Button, Link, TextField, Typography } from '@mui/material';
import { BASE_URL } from '../../api/baseUrl';

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const handleSignup = async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/users/signup`,
        {
          name: name,
          email: email,
          password: password,
          passwordConfirm: passwordConfirm,
          role: 'user',
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
        Create your new account
      </Typography>

      <TextField
        label='Name'
        variant='outlined'
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ margin: '10px 0px', width: '300px' }}
      />

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

      <TextField
        label='Confirm Password'
        variant='outlined'
        type='password'
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        style={{ margin: '10px 0px', width: '300px' }}
      />

      <Button
        onClick={handleSignup}
        variant='contained'
        style={{
          width: '300px',
          height: 50,
          borderRadius: 12,
          marginTop: '20px',
          backgroundColor: '#1976d2',
          color: '#fff',
        }}>
        Sign up
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

export default Signup;
