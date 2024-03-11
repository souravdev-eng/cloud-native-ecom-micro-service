import React, { useState } from 'react';
import Button from '@mui/material/Button';
import axios from 'axios';
import { BASE_URL } from '../../api/baseUrl';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConform, setPasswordConform] = useState('');
  const [name, setName] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/users/signup`,
        {
          name: name,
          email: email,
          password: password,
          passwordConform: passwordConform,
          role: 'user',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      console.log({ response });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <h1>Create your new account</h1>
        <div style={{ margin: '10px 0px' }}>
          <div style={{ padding: '10px 0px' }}>
            <label htmlFor='email'>Name</label>
          </div>
          <input
            style={{
              height: '30px',
              width: '300px',
              padding: '10px',
              borderRadius: '12px',
              border: '1px solid #adb5bd',
              fontSize: 16,
            }}
            id='name'
            type='name'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div style={{ margin: '10px 0px' }}>
          <div style={{ padding: '10px 0px' }}>
            <label htmlFor='email'>Email</label>
          </div>
          <input
            style={{
              height: '30px',
              width: '300px',
              padding: '10px',
              borderRadius: '12px',
              border: '1px solid #adb5bd',
              fontSize: 16,
            }}
            id='email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <div style={{ padding: '10px 0px' }}>
            <label htmlFor='password'>Password</label>
          </div>
          <input
            style={{
              height: '30px',
              width: '300px',
              padding: '10px',
              borderRadius: '12px',
              border: '1px solid #adb5bd',
              fontSize: 16,
            }}
            id='password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <div style={{ padding: '10px 0px' }}>
            <label htmlFor='confirm-password'>Confirm Password</label>
          </div>
          <input
            style={{
              height: '30px',
              width: '300px',
              padding: '10px',
              borderRadius: '12px',
              border: '1px solid #adb5bd',
              fontSize: 16,
            }}
            id='confirm-password'
            type='password'
            value={passwordConform}
            onChange={(e) => setPasswordConform(e.target.value)}
          />
        </div>

        <div style={{ marginTop: '20px' }}>
          <Button
            onClick={handleLogin}
            variant='contained'
            style={{ width: '300px', height: 50, borderRadius: 12 }}>
            Sign up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
