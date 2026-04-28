import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import Rating from '@mui/material/Rating';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCartOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBackRounded';
import LocalOfferIcon from '@mui/icons-material/LocalOfferRounded';

import { useProductDetails } from './ProductDetails.hook';
import * as Styled from './ProductDetails.styles';

const ProductDetails: React.FC = () => {
    const navigate = useNavigate();
    const { product, isLoading, qty, incrementQty, decrementQty, handleAddToCart } =
        useProductDetails();

    if (isLoading) {
        return (
            <Styled.PageWrapper>
                <Styled.LoadingContainer>
                    <CircularProgress sx={{ color: '#228be6' }} />
                </Styled.LoadingContainer>
            </Styled.PageWrapper>
        );
    }

    const inStock = (product?.quantity ?? 0) > 0;

    return (
        <Styled.PageWrapper>
            <Styled.Breadcrumb>
                <span onClick={() => navigate('/')}>Home</span>
                <span className="separator">/</span>
                <span onClick={() => navigate('/products')}>Products</span>
                <span className="separator">/</span>
                <span style={{ color: '#495057', cursor: 'default' }}>
                    {product?.title ?? '—'}
                </span>
            </Styled.Breadcrumb>

            <Styled.Container>
                {/* Left – Image */}
                <Styled.ImageSection>
                    <Styled.ProductImageContainer>
                        <Styled.ProductImage
                            src={product?.image}
                            alt={product?.title}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                    'https://via.placeholder.com/400x400?text=No+Image';
                            }}
                        />
                        <Styled.StockBadge instock={String(inStock)}>
                            {inStock ? `${product?.quantity} in stock` : 'Out of stock'}
                        </Styled.StockBadge>
                    </Styled.ProductImageContainer>

                    <Styled.TagsRow>
                        {product?.tags?.map((tag) => (
                            <Styled.TagChip
                                key={tag}
                                icon={<LocalOfferIcon style={{ fontSize: 12 }} />}
                                label={tag}
                                size="small"
                            />
                        ))}
                    </Styled.TagsRow>
                </Styled.ImageSection>

                {/* Right – Details */}
                <Styled.DetailsSection>
                    {product?.category && (
                        <Styled.CategoryBadge>{product.category}</Styled.CategoryBadge>
                    )}

                    <Styled.ProductTitle>{product?.title}</Styled.ProductTitle>

                    <Styled.RatingRow>
                        <Rating
                            value={Number(product?.rating ?? 0)}
                            precision={0.5}
                            readOnly
                            size="small"
                        />
                        <span>{product?.rating?.toFixed(1)} rating</span>
                    </Styled.RatingRow>

                    <Styled.PriceRow>
                        <Styled.ProductPrice>
                            ${product?.price?.toLocaleString()}
                        </Styled.ProductPrice>
                    </Styled.PriceRow>

                    <div>
                        <Styled.DescriptionLabel>About this product</Styled.DescriptionLabel>
                        <Styled.ProductDescription>
                            {product?.description || 'No description available.'}
                        </Styled.ProductDescription>
                    </div>

                    <Styled.QuantityRow>
                        <Styled.QuantityLabel>Quantity</Styled.QuantityLabel>
                        <Styled.QuantityControls>
                            <Styled.QuantityBtn onClick={decrementQty} disabled={qty <= 1}>
                                −
                            </Styled.QuantityBtn>
                            <Styled.QuantityValue>{qty}</Styled.QuantityValue>
                            <Styled.QuantityBtn
                                onClick={incrementQty}
                                disabled={!inStock || qty >= (product?.quantity ?? 0)}
                            >
                                +
                            </Styled.QuantityBtn>
                        </Styled.QuantityControls>
                    </Styled.QuantityRow>

                    <Styled.AddToCartButton
                        disabled={!inStock}
                        onClick={handleAddToCart}
                        startIcon={<ShoppingCartIcon />}
                    >
                        {inStock ? 'Add to Cart' : 'Out of Stock'}
                    </Styled.AddToCartButton>

                    <Styled.AddToCartButton
                        onClick={() => navigate('/products')}
                        sx={{
                            backgroundColor: 'transparent',
                            color: '#495057',
                            border: '1px solid #dee2e6',
                            boxShadow: 'none',
                            '&:hover': {
                                backgroundColor: '#f8f9fa',
                                transform: 'none',
                                boxShadow: 'none',
                            },
                        }}
                        startIcon={<ArrowBackIcon />}
                    >
                        Back to Products
                    </Styled.AddToCartButton>
                </Styled.DetailsSection>
            </Styled.Container>
        </Styled.PageWrapper>
    );
};

export default ProductDetails;
