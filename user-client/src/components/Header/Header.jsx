import React, { useState } from 'react';
import { AppBar, Box, Toolbar, Typography, IconButton, Badge, MenuItem, Menu } from '@mui/material';
import { AccountCircle, Notifications, Login } from '@mui/icons-material';
import axios from 'axios';
import { BASE_URL } from '../../api/baseUrl';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const isMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/users/signout`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.data) {
        localStorage.clear('user');
        navigate('/auth/login');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}>
      <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
      <MenuItem onClick={handleMenuClose}>My account</MenuItem>
      <MenuItem onClick={handleSignOut}>
        Sign out <Login />
      </MenuItem>
    </Menu>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position='static'>
        <Toolbar>
          <Typography
            variant='h6'
            noWrap
            component='div'
            sx={{ display: { xs: 'none', sm: 'block' } }}>
            Ecom
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            {user && (
              <>
                <IconButton size='large' aria-label='show 17 new notifications' color='inherit'>
                  <Badge badgeContent={17} color='error'>
                    <Notifications />
                  </Badge>
                </IconButton>
                <IconButton
                  size='large'
                  edge='end'
                  aria-label='account of current user'
                  aria-controls='primary-search-account-menu'
                  aria-haspopup='true'
                  onClick={handleProfileMenuOpen}
                  color='inherit'>
                  <AccountCircle />
                </IconButton>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      {renderMenu}
    </Box>
  );
};

export default Header;
