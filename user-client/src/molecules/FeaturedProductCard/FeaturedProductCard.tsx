import { FC } from 'react';
import styles from './FeaturedProductCard.module.css';
import { Rating, styled } from '@mui/material';
import { FeatureProductCardProps } from './types';

const StyledRating = styled(Rating)({
    '& .MuiRating-iconFilled': {
        color: '#868e96',
    },
    '& .MuiRating-iconHover': {
        color: '#dee2e6',
    },
});

const FeaturedProductCard: FC<FeatureProductCardProps> = ({
    image,
    tags,
    price,
    title,
    rating,
    onClick,
    handleAddToCart,
}) => {
    return (
        <div className={styles.cardContainer} onClick={onClick}>
            <div>
                <img src={image} alt={title} className={styles.cardImage} />
                <div className={styles.quickView}>QUICK VIEW</div>
            </div>
            <p className={styles.tag}>{tags}</p>
            <h3 className={styles.title}>{title}</h3>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}>
                <StyledRating
                    name='half-rating-read'
                    value={rating || 0}
                    precision={0.5}
                    readOnly
                    size='small'
                />
                <h5 className={styles.price}>${price.toFixed(2)}</h5>
            </div>
            <div className={styles.button} onClick={handleAddToCart}>
                Add To Cart
            </div>
        </div>
    );
};

export default FeaturedProductCard;
