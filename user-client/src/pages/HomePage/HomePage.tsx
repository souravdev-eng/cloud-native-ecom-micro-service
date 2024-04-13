import React from 'react';
import HeroImageSlider from '../../molecules/HeroImageSlider/HeroImageSlider';
import HeaderSearch from '../../organisms/HeaderSearch/HeaderSearch';
import FeaturedProductList from '../../organisms/FeaturedProductList/FeaturedProductList';

const HomePage = () => {
  return (
    <>
      <HeaderSearch />
      <HeroImageSlider />
      <div
        style={{
          maxWidth: '80%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'center',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
        <FeaturedProductList />
      </div>
      <div
        style={{
          maxWidth: '80%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'center',
          marginLeft: 'auto',
          marginRight: 'auto',
          marginTop: '80px',
        }}>
        <FeaturedProductList />
      </div>
    </>
  );
};

export default HomePage;
