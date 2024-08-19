import { useParams } from 'react-router-dom';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Button from '../../atoms/Button/Button';
import styles from './ProductDetails.module.css';

import { useProductDetails } from './ProductDetails.hook';
import Divider from '../../atoms/Divider/Divider';

const ProductDetails = () => {
    const { id } = useParams();
    const {
        cartQty,
        loading,
        productDetail,
        addCartQty,
        removeCartQty,
        handleAddToCart,
    } = useProductDetails(id as string);
    const isFavorite = false;

    if (loading) {
        return <h1>Loading....</h1>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.productWrapper}>
                <div>
                    <img
                        src={productDetail?.image}
                        alt='Bag'
                        className={styles.productImage}
                    />
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 5,
                        }}>
                        {[1, 2, 3, 4].map((_, idx) => (
                            <img
                                key={idx}
                                src={productDetail?.image}
                                alt='Bag'
                                className={styles.productImageSm}
                            />
                        ))}
                    </div>
                </div>
                <div>
                    <h2 className={styles.title}>{productDetail?.title}</h2>
                    <Divider />
                    <p className={styles.price}>
                        ${productDetail?.price?.toFixed(2)}
                    </p>
                    <p className={styles.description}>
                        {productDetail?.description}
                    </p>
                    <p className={styles.tag_sm_bold}>
                        <span className={styles.tag_sm}>Availability:</span> In
                        Stock
                    </p>
                    <p className={styles.tag_sm_bold}>
                        <span className={styles.tag_sm}>Sku:</span>{' '}
                        654111995-1-2
                    </p>
                    {productDetail?.tags.length ? (
                        <p className={styles.tag_sm_bold}>
                            <span className={styles.tag_sm}>Categories:</span>{' '}
                            {(productDetail?.tags as string[])?.join(', ')}
                        </p>
                    ) : null}

                    <Divider />
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                        }}>
                        <div className={styles.cartEditWrapper}>
                            <div
                                className={styles.cartButtonWrapper}
                                onClick={removeCartQty}>
                                -
                            </div>
                            <div className={styles.cartValueText}>
                                {cartQty}
                            </div>
                            <div
                                className={styles.cartButtonWrapper}
                                onClick={addCartQty}>
                                +
                            </div>
                        </div>
                        <Button
                            title='ADD TO CART'
                            loading={false}
                            onClick={handleAddToCart}
                            style={{
                                width: 180,
                                borderRadius: 0,
                            }}
                        />
                        <div
                            style={{
                                border: '1px solid #adb5bd',
                                width: 40,
                                height: 40,
                                textAlign: 'center',
                                cursor: 'pointer',
                                fontSize: 18,
                                paddingTop: 8,
                            }}>
                            {isFavorite ? (
                                <FavoriteIcon style={{ color: '#e64980' }} />
                            ) : (
                                <FavoriteBorderIcon
                                    style={{ color: '#343a40' }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
