import { useEffect } from 'react';
import { HeroImageSlider } from '../../molecules';
import { FeaturedProductList } from '../../organisms';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { productListAction } from '../../store/actions/product/productList.action';
import styles from './Home.module.css';

const HomePage = () => {
    const dispatch = useAppDispatch();
    const { productList } = useAppSelector((state) => state.product);

    useEffect(() => {
        dispatch(productListAction());
    }, [dispatch]);

    return (
        <>
            <HeroImageSlider />
            <div className={styles.featuredContainer}>
                <FeaturedProductList
                    featuredHeading='FEATURED PRODUCTS'
                    productList={productList.slice(0, 8)}
                />
            </div>

            <div className={styles.featuredContainer}>
                <FeaturedProductList
                    featuredHeading='NEW ARRIVALS'
                    productList={productList.slice(8, 16)}
                />
            </div>
        </>
    );
};

export default HomePage;
