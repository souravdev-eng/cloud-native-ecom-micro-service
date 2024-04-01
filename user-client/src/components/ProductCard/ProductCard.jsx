import React from 'react';
import { Card, CardActions, CardContent, CardMedia, Button, Typography } from '@mui/material';

const ProductCard = ({ image, title, description, price, onClick, handleAddToCart }) => {
  return (
    <Card sx={{ width: 255, cursor: 'pointer' }} onClick={onClick}>
      <CardMedia sx={{ height: 140 }} image={image} title='green iguana' />
      <CardContent>
        <Typography
          gutterBottom
          variant='h5'
          component='div'
          sx={{
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 1,
          }}>
          {title}
        </Typography>
        <Typography gutterBottom variant='h6' component='span' mb={2}>
          ${price}
        </Typography>
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 3,
          }}>
          {description}
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          variant='contained'
          size='small'
          style={{ marginLeft: 'auto' }}
          onClick={handleAddToCart}>
          Add To Cart
        </Button>
      </CardActions>
    </Card>
  );
};

export default ProductCard;
