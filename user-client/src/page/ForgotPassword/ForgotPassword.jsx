import axios from 'axios';
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Button, Link, TextField, Typography } from '@mui/material';
import { BASE_URL } from '../../api/baseUrl';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleForgotPassword = async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/users/forgot-password`,
        { email },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.data) {
        alert('Email sent!');
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
        Reset your password
      </Typography>

      <TextField
        label='Email'
        variant='outlined'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ margin: '10px 0px', width: '300px' }}
      />

      <Button
        onClick={handleForgotPassword}
        variant='contained'
        style={{
          width: '300px',
          height: 50,
          borderRadius: 12,
          marginTop: '20px',
          backgroundColor: '#1976d2',
          color: '#fff',
        }}>
        RESET PASSWORD
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

export default ForgotPassword;
