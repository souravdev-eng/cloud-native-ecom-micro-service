import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Rating } from '@mui/material';
import { BASE_URL } from '../../api/baseUrl';

const ProductDetails = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  const { id } = useParams();

  const getProductDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/product/${id}`, {
        // params: { id },
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.data) {
        setProduct(response?.data);
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      console.log('Getting error', error?.response?.data?.errors);
      setProduct(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    getProductDetails();
  }, [id]);

  return (
    <>
      {!product ? (
        <h3>Loading...</h3>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 20 }}>
          <div style={{ width: 400, height: 300, objectFit: 'fill' }}>
            <img src={product?.image} style={{ width: '100%', height: '100%' }} />
          </div>
          <div style={{ width: '500px' }}>
            <h1>{product?.title}</h1>
            <h3>${product?.price?.toFixed(2)}</h3>
            <div>
              <Rating
                name='half-rating-read'
                precision={0.5}
                defaultValue={product?.rating}
                readOnly
              />
            </div>
            <p style={{ whiteSpace: 'pre-line' }}>{product?.description}</p>
            <Button variant='contained'>Buy Now</Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetails;
