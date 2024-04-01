import React from 'react';
import { Button } from '@mui/material';

const ProductDetails = () => {
  return (
    <div>
      <div style={{ border: '1px solid #000', width: 400, height: 300, objectFit: 'fill' }}></div>
      <div style={{ width: '500px' }}>
        <h1>Title:</h1>
        <h3>Price:</h3>
        <span>Description:</span>
        <Button variant='contained'>Buy Now</Button>
      </div>
    </div>
  );
};

export default ProductDetails;
