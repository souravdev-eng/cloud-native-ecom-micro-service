import { HeroImageSlider } from '../../molecules';
import { FeaturedProductList } from '../../organisms';
import { useHomePage } from './HomePage.hook';
import styles from './Home.module.css';

const HomePage = () => {
    const { productList } = useHomePage();

    return (
        <>
            <HeroImageSlider />
            <div className={styles.featuredContainer}>
                <FeaturedProductList
                    featuredHeading='FEATURED PRODUCTS'
                    productList={productList.slice(0, 8)}
                />
            </div>

            {/* <div className={styles.featuredContainer}>
                <FeaturedProductList
                    featuredHeading='NEW ARRIVALS'
                    productList={productList.slice(8, 16)}
                />
            </div> */}
        </>
    );
};

export default HomePage;
