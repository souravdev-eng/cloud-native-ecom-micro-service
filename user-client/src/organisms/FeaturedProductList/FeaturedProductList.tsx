import { FC } from 'react';
import { FeaturedProductCard } from '../../molecules';
import FeaturedDivider from '../../atoms/FeaturedDivider/FeaturedDivider';
import styles from './FeaturedProductList.module.css';

type ProductProps = {
  title: string;
  image: string;
  price: number;
  tags?: string;
  rating?: number;
};

interface FeaturedProductListProps {
  featuredHeading: string;
  productList: ProductProps[];
}

const FeaturedProductList: FC<FeaturedProductListProps> = ({ productList, featuredHeading }) => {
  return (
    <div className={styles.container}>
      <FeaturedDivider title={featuredHeading} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 30,
          width: '100%',
          backgroundColor: '#fbfbfb',
        }}>
        {productList?.map((el, idx) => (
          <FeaturedProductCard
            key={idx}
            {...el}
            onClick={() => {
              console.log('details', el);
            }}
            handleAddToCart={(e) => {
              e.stopPropagation();
              console.log('Add to cart');
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedProductList;
