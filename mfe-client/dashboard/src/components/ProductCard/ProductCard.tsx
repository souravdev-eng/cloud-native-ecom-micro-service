import StarIcon from '@mui/icons-material/StarRounded';

import * as Styled from './ProductCard.style.tsx';

export interface IProductCard {
    id: string;
    title: string;
    price: number;
    image: string;
    tags?: string[];
    rating?: number;
    onClick?: () => void;
}

const ProductCard = ({ title, price, image, tags, rating, onClick }: IProductCard) => {
    return (
        <Styled.Container onClick={onClick}>
            <Styled.ImageWrapper>
                <Styled.ProductImage
                    src={image}
                    alt={title}
                    onError={(e) => {
                        (e.target as HTMLImageElement).src =
                            'https://via.placeholder.com/300x300?text=No+Image';
                    }}
                />
                <Styled.SaleChip>Sale</Styled.SaleChip>
            </Styled.ImageWrapper>

            <Styled.ProductContent>
                {tags && tags.length > 0 && (
                    <Styled.ProductTag>{tags.slice(0, 2).join(' · ')}</Styled.ProductTag>
                )}
                <Styled.ProductTitle>{title}</Styled.ProductTitle>
                <Styled.PriceRatingRow>
                    <Styled.ProductPrice>${price.toLocaleString()}</Styled.ProductPrice>
                    {rating != null && (
                        <Styled.RatingChip>
                            <StarIcon style={{ fontSize: 13 }} />
                            {rating.toFixed(1)}
                        </Styled.RatingChip>
                    )}
                </Styled.PriceRatingRow>
            </Styled.ProductContent>

            <Styled.Button className="product-btn">Add To Cart</Styled.Button>
        </Styled.Container>
    );
};

export default ProductCard;
