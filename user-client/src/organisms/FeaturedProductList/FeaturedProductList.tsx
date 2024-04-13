import styles from './FeaturedProductList.module.css';
import { FeaturedProductCard } from '../../molecules';

const data = [
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

const FeaturedProductList = () => {
  return (
    <div className={styles.container}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}>
        <div
          style={{
            flexGrow: 1,
            height: '1px',
            backgroundColor: '#000',
            marginRight: '12px',
          }}
        />
        <h3 style={{ margin: '0 12px' }}>FEATURED PRODUCTS</h3>
        <div
          style={{
            flexGrow: 1,
            height: '1px',
            backgroundColor: '#000',
            marginLeft: '12px',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 30,
          width: '100%',
        }}>
        {data.map((el, idx) => (
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
