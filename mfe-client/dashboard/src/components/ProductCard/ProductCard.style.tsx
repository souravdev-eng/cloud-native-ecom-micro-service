import { styled } from '@mui/material';

export const Container = styled('div')({
  display: 'flex',
  border: '1px solid black',
  width: 300,
  flexDirection: 'column',
  padding: 8,
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
});

export const ProductImage = styled(`img`)({
  width: '100%',
  aspectRatio: 1 / 0.9,
  objectFit: 'cover',
});
