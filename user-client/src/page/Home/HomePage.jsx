import React, { useEffect, useState } from 'react';
import { BASE_URL } from '../../api/baseUrl';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const HomePage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  const getCurrentUser = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/users/currentuser`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.data) {
        setCurrentUser(response?.data);
        localStorage.setItem('user', JSON.stringify(response?.data?.currentUser));
      }
    } catch (error) {
      console.log('Getting error', error?.response?.data?.errors);
      setCurrentUser(null);
      navigate('/auth/signup');
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      navigate('/auth/signup');
      return;
    }
  }, []);

  return (
    <div>
      <h2>Home Page</h2>
    </div>
  );
};

export default HomePage;
