import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BASE_URL } from '../../api/baseUrl';
import ProductCard from '../../components/ProductCard/ProductCard';
import ProductSkeleton from '../../components/ProductSkeleton/ProductSkeleton';

const HomePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [productList, setProductList] = useState([]);

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

  const getAllProduct = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/product`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.data) {
        setProductList(response?.data);
        setLoading(false);
      }
    } catch (error) {
      console.log('Getting error', error?.response?.data?.errors);
      setProductList([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    getAllProduct();
  }, [currentUser]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      navigate('/auth/signup');
      return;
    }
  }, []);

  return (
    <div style={{ margin: 16 }}>
      <h2>Home Page</h2>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
        {!loading && productList?.length > 0
          ? productList.map((el) => (
              <ProductCard
                title={el.title}
                key={el.id}
                image={el.image}
                price={el.price}
                description={el.description}
                onClick={() => navigate(`/product-details/${el.id}`)}
              />
            ))
          : Array.from(new Array(30)).map((_, idx) => <ProductSkeleton key={idx} />)}
      </div>
    </div>
  );
};

export default HomePage;
