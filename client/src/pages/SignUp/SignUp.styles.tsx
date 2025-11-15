import { Box, styled, TextField, Button as MuiButton } from '@mui/material';

export const Container = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  width: '100vw',
});

export const Wrapper = styled(Box)({
  backgroundColor: 'white',
  display: 'flex',
  justifyContent: 'center',
  width: '30%',
  flexDirection: 'column',
  borderRadius: 20,
  gap: 10,
  boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
  padding: 20,
  paddingTop: 30,
  paddingBottom: 30,
});

export const Input = styled(TextField)({
  width: '100%',
  borderRadius: 10,
  fontSize: 16,
  fontWeight: 400,
  marginBottom: 12,
});

export const Button = styled(MuiButton)({
  width: '100%',
  borderRadius: 10,
  fontSize: 16,
  fontWeight: 400,
  marginBottom: 12,
  backgroundColor: '#212529',
  padding: 10,
  color: '#fff',
  textTransform: 'none',
});

export const Link = styled('a')({
  color: '#0075AF',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
});