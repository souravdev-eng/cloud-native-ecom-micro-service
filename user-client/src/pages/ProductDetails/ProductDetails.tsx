import React from 'react';
import styles from './ProductDetails.module.css';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Button from '../../atoms/Button/Button';
import { useParams } from 'react-router-dom';
import { useProductDetails } from './ProductDetails.hook';

const ProductDetails = () => {
    const { id } = useParams();
    const { loading, productDetail } = useProductDetails(id as string);
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
                    <hr
                        style={{
                            border: 'none',
                            borderTop: '2px solid #e0e0e0',
                            margin: '10px 0',
                            width: 40,
                        }}
                    />
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

                    <hr
                        style={{
                            border: 'none',
                            borderTop: '1px solid #e0e0e0',
                            margin: '20px 0',
                        }}
                    />
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                        }}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                justifyItems: 'center',
                            }}>
                            <div
                                style={{
                                    border: '1px solid #adb5bd',
                                    width: 25,
                                    height: 40,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    fontSize: 18,
                                    paddingTop: 8,
                                }}>
                                -
                            </div>
                            <div
                                style={{
                                    borderTop: '1px solid #adb5bd',
                                    borderBottom: '1px solid #adb5bd',
                                    width: 40,
                                    height: 40,
                                    textAlign: 'center',
                                    fontSize: 20,
                                    paddingTop: 8,
                                }}>
                                1
                            </div>
                            <div
                                style={{
                                    border: '1px solid #adb5bd',
                                    width: 25,
                                    height: 40,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    fontSize: 18,
                                    paddingTop: 8,
                                }}>
                                +
                            </div>
                        </div>
                        <Button
                            title='ADD TO CART'
                            loading={false}
                            onClick={() => {}}
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
