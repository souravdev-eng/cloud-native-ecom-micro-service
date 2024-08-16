import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeaturedProductCard } from '../../molecules';
import FeaturedDivider from '../../atoms/FeaturedDivider/FeaturedDivider';
import styles from './FeaturedProductList.module.css';

type ProductProps = {
    id?: string;
    title: string;
    image: string;
    price: number;
    tags?: string | string[];
    rating?: number;
};

interface FeaturedProductListProps {
    featuredHeading: string;
    productList: ProductProps[];
}

const FeaturedProductList: FC<FeaturedProductListProps> = ({
    productList,
    featuredHeading,
}) => {
    const navigation = useNavigate();
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
                    flexWrap: 'wrap',
                }}>
                {productList?.map((el, idx) => (
                    <FeaturedProductCard
                        key={idx}
                        title={el.title}
                        image={el.image}
                        price={el.price}
                        rating={el.rating}
                        tags={el?.tags || 'Test'}
                        onClick={() => {
                            console.log('details', el);
                            navigation(`/product-details/${el.id}`);
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
