import React from 'react';
import { Link } from 'react-router-dom';

import * as Styled from './Header.styles';
import { Typography, Divider } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const MenuItem = [
  {
    id: 1,
    title: 'My Account',
    path: '/user/my-account',
  },
  {
    id: 2,
    title: 'About Us',
    path: '/about-us',
  },
  {
    id: 3,
    title: 'Blog',
    path: '/blog',
  },
  {
    id: 4,
    title: 'My Wishlist',
    path: '/user/my-wishlist',
  },
  {
    id: 5,
    title: 'Cart',
    path: '/cart',
  },
  {
    id: 6,
    title: 'Log in',
    path: '/user/auth/signin',
  },
];

const Header = () => {
  return (
    <Styled.Container>
      <Styled.CouponContainer>
        <Typography color='#fff'>
          Get Up to <span style={{ fontWeight: 600 }}> 40% OFF </span>New-Season Styles
        </Typography>
        <div style={{ display: 'flex', gap: 10 }}>
          <div
            style={{
              backgroundColor: '#0075AF',
              fontSize: 10,
              padding: 10,
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            MEN
          </div>
          <div
            style={{
              backgroundColor: '#0075AF',
              fontSize: 10,
              padding: 10,
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            WOMEN
          </div>
        </div>
        <span
          style={{
            color: '#8BC2E5',
            fontSize: 13,
          }}
        >
          * Limited time only.
        </span>
      </Styled.CouponContainer>
      <Styled.SubHeaderContainer>
        <Styled.SubHeaderTitle>FREE RETURNS. STANDARD SHIPPING ORDERS $99+</Styled.SubHeaderTitle>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ display: 'flex', listStyle: 'none', gap: 20 }}>
            {MenuItem.map((el) => (
              <li key={el.id}>
                <Styled.MenuItemLink to={el.path}>{el.title}</Styled.MenuItemLink>
              </li>
            ))}
          </div>
          <div>
            <span style={{ fontSize: 12, fontWeight: 'bold', color: '#868e96' }}>INR</span>
            <KeyboardArrowDownIcon sx={{ color: '#868e96', fontSize: 14, fontWeight: 'bold' }} />
          </div>
          <FacebookIcon sx={{ color: '#868e96', fontSize: 16 }} />
          <XIcon sx={{ color: '#868e96', fontSize: 16 }} />
          <InstagramIcon sx={{ color: '#868e96', fontSize: 16 }} />
        </div>
      </Styled.SubHeaderContainer>
      <Divider />
    </Styled.Container>
  );
};

export default Header;
