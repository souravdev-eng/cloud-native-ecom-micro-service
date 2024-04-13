import React from 'react';
import { HeroImageSlider } from '../../molecules';
import { HeaderSearch, FeaturedProductList } from '../../organisms';

import styles from './Home.module.css';

const DATA = [
  {
    title: 'Brown Women Casual HandBag',
    tags: 'ACCESSORIES, BEST SELLING PRODUCTS',
    price: 299,
    image:
      'https://porto-demo.myshopify.com/cdn/shop/products/BrownWomenCasualHandBag1_400x400_crop_center.jpg?v=1606122820',
  },
  {
    title: 'Brown Women Casual HandBag',
    tags: 'ACCESSORIES, BEST SELLING PRODUCTS',
    price: 299,
    rating: 4.3,
    image:
      'https://porto-demo.myshopify.com/cdn/shop/products/BrownWomenCasualHandBag1_400x400_crop_center.jpg?v=1606122820',
  },
  {
    title: 'Brown Women Casual HandBag',
    tags: 'ACCESSORIES, BEST SELLING PRODUCTS',
    price: 299,
    rating: 4.3,
    image:
      'https://porto-demo.myshopify.com/cdn/shop/products/BrownWomenCasualHandBag1_400x400_crop_center.jpg?v=1606122820',
  },
  {
    title: 'Brown Women Casual HandBag',
    tags: 'ACCESSORIES, BEST SELLING PRODUCTS',
    price: 299,
    rating: 4.3,
    image:
      'https://porto-demo.myshopify.com/cdn/shop/products/BrownWomenCasualHandBag1_400x400_crop_center.jpg?v=1606122820',
  },
];

const HomePage = () => {
  return (
    <>
      <HeaderSearch />
      <HeroImageSlider />

      <div className={styles.featuredContainer}>
        <FeaturedProductList featuredHeading='FEATURED PRODUCTS' productList={DATA} />
      </div>

      <div className={styles.featuredContainer}>
        <FeaturedProductList featuredHeading='NEW ARRIVALS' productList={DATA} />
      </div>
    </>
  );
};

export default HomePage;
