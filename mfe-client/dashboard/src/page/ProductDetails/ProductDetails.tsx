import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import Rating from '@mui/material/Rating';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCartOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBackRounded';
import LocalOfferIcon from '@mui/icons-material/LocalOfferRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineRounded';
import CloseIcon from '@mui/icons-material/CloseRounded';
import LockPersonIcon from '@mui/icons-material/LockPersonRounded';

import { useProductDetails } from './ProductDetails.hook';
import * as Styled from './ProductDetails.styles';

const ProductDetails: React.FC = () => {
    const navigate = useNavigate();
    const {
        product,
        isLoading,
        loadError,
        requiresAuth,
        qty,
        incrementQty,
        decrementQty,
        handleAddToCart,
        addingToCart,
        feedback,
        dismissFeedback,
    } = useProductDetails();

    if (isLoading) {
        return (
            <Styled.PageWrapper>
                <Styled.LoadingContainer>
                    <CircularProgress sx={{ color: '#228be6' }} />
                </Styled.LoadingContainer>
            </Styled.PageWrapper>
        );
    }

    // The product service guards every route with requireAuth, so a signed-out
    // visitor previously got a silent console error and a blank page.
    if (requiresAuth) {
        return (
            <Styled.PageWrapper>
                <Styled.NoticeContainer>
                    <LockPersonIcon sx={{ fontSize: 64, color: '#dee2e6' }} />
                    <Styled.NoticeTitle>Sign in to view this product</Styled.NoticeTitle>
                    <Styled.NoticeText>
                        The product catalogue requires an account.
                    </Styled.NoticeText>
                    <Styled.NoticeActions>
                        <Styled.AddToCartButton
                            sx={{ width: 'auto', px: 4 }}
                            onClick={() =>
                                navigate(
                                    `/user/auth/signin?next=${encodeURIComponent(window.location.pathname)}`,
                                )
                            }
                        >
                            Sign in
                        </Styled.AddToCartButton>
                    </Styled.NoticeActions>
                </Styled.NoticeContainer>
            </Styled.PageWrapper>
        );
    }

    if (loadError || !product) {
        return (
            <Styled.PageWrapper>
                <Styled.NoticeContainer>
                    <ErrorOutlineIcon sx={{ fontSize: 64, color: '#dee2e6' }} />
                    <Styled.NoticeTitle>Product unavailable</Styled.NoticeTitle>
                    <Styled.NoticeText>
                        {loadError ?? 'This product could not be found.'}
                    </Styled.NoticeText>
                    <Styled.NoticeActions>
                        <Styled.AddToCartButton
                            sx={{ width: 'auto', px: 4 }}
                            onClick={() => navigate('/products')}
                            startIcon={<ArrowBackIcon />}
                        >
                            Back to Products
                        </Styled.AddToCartButton>
                    </Styled.NoticeActions>
                </Styled.NoticeContainer>
            </Styled.PageWrapper>
        );
    }

    const inStock = (product?.quantity ?? 0) > 0;

    return (
        <Styled.PageWrapper>
            {/* Add-to-cart result */}
            {feedback && (
                <Styled.Toast tone={feedback.type}>
                    {feedback.type === 'success' ? (
                        <CheckCircleIcon sx={{ fontSize: 20, color: '#12b886' }} />
                    ) : (
                        <ErrorOutlineIcon sx={{ fontSize: 20, color: '#e03131' }} />
                    )}
                    <span>
                        {feedback.message}
                        {feedback.type === 'success' && (
                            <>
                                {' '}
                                <a
                                    href="/user/cart"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        navigate('/user/cart');
                                    }}
                                    style={{ color: '#228be6', fontWeight: 600 }}
                                >
                                    View cart
                                </a>
                            </>
                        )}
                    </span>
                    <Styled.ToastClose onClick={dismissFeedback} aria-label="Dismiss">
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </Styled.ToastClose>
                </Styled.Toast>
            )}

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
                        disabled={!inStock || addingToCart}
                        onClick={handleAddToCart}
                        startIcon={
                            addingToCart ? (
                                <CircularProgress size={16} sx={{ color: '#adb5bd' }} />
                            ) : (
                                <ShoppingCartIcon />
                            )
                        }
                    >
                        {!inStock
                            ? 'Out of Stock'
                            : addingToCart
                              ? 'Adding…'
                              : 'Add to Cart'}
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
