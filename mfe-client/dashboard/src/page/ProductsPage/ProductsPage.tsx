import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/SearchRounded';
import StarIcon from '@mui/icons-material/StarRounded';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCartOutlined';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightIcon from '@mui/icons-material/ChevronRightRounded';
import FirstPageIcon from '@mui/icons-material/FirstPageRounded';

import { useProductsPage, Product } from './ProductsPage.hook';
import ProductFilters from '../../components/ProductFilters/ProductFilters';
import * as Styled from './ProductsPage.styles';

const ProductsPage: React.FC = () => {
    const navigate = useNavigate();
    const {
        products,
        isLoading,
        meta,
        filters,
        categories,
        currentPage,
        hasNextPage,
        hasPrevPage,
        handleNextPage,
        handlePrevPage,
        handleFirstPage,
        updateFilter,
        resetFilters,
        applyFilters,
    } = useProductsPage();

    const handleProductClick = (productId: string) => {
        navigate(`/product/${productId}`);
    };

    const handleSearchKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    };

    return (
        <Styled.PageContainer>
            {/* Left Sidebar - Filters */}
            <ProductFilters
                filters={filters}
                categories={categories}
                updateFilter={updateFilter}
                resetFilters={resetFilters}
                applyFilters={applyFilters}
            />

            {/* Right Content - Products */}
            <Styled.ContentArea>
                {/* Search & Sort Header */}
                <Styled.ContentHeader>
                    <Styled.SearchContainer>
                        <SearchIcon sx={{ color: '#adb5bd', mr: 1 }} />
                        <Styled.SearchInput
                            type="text"
                            placeholder="Search products..."
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            onKeyPress={handleSearchKeyPress}
                        />
                    </Styled.SearchContainer>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Styled.ResultsInfo>
                            {meta.count} products found
                        </Styled.ResultsInfo>
                        <Styled.SortSelect
                            value={filters.sortBy}
                            onChange={(e) => {
                                updateFilter('sortBy', e.target.value);
                                setTimeout(applyFilters, 0);
                            }}
                        >
                            <option value="-_id">Newest First</option>
                            <option value="_id">Oldest First</option>
                            <option value="price">Price: Low to High</option>
                            <option value="-price">Price: High to Low</option>
                            <option value="-rating">Top Rated</option>
                        </Styled.SortSelect>
                    </div>
                </Styled.ContentHeader>

                {/* Products Grid */}
                {isLoading ? (
                    <Styled.LoadingContainer>
                        <CircularProgress sx={{ color: '#228be6' }} />
                    </Styled.LoadingContainer>
                ) : products.length === 0 ? (
                    <Styled.EmptyState>
                        <Styled.EmptyIcon>
                            <InventoryIcon sx={{ fontSize: 'inherit' }} />
                        </Styled.EmptyIcon>
                        <Styled.EmptyTitle>No products found</Styled.EmptyTitle>
                        <Styled.EmptyText>
                            Try adjusting your filters or search terms
                        </Styled.EmptyText>
                    </Styled.EmptyState>
                ) : (
                    <>
                        <Styled.ProductsGrid>
                            {products.map((product: Product) => (
                                <Styled.ProductCardWrapper
                                    key={product.id}
                                    onClick={() => handleProductClick(product.id)}
                                >
                                    <div style={{ position: 'relative' }}>
                                        <Styled.ProductImage
                                            src={product.image}
                                            alt={product.title}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src =
                                                    'https://via.placeholder.com/300x220?text=No+Image';
                                            }}
                                        />
                                        <Styled.StockBadge inStock={product.quantity > 0}>
                                            {product.quantity > 0
                                                ? `${product.quantity} in stock`
                                                : 'Out of stock'}
                                        </Styled.StockBadge>
                                    </div>
                                    <Styled.ProductInfo>
                                        <Styled.ProductCategory>
                                            {product.category}
                                        </Styled.ProductCategory>
                                        <Styled.ProductTitle>
                                            {product.title}
                                        </Styled.ProductTitle>
                                        <Styled.ProductMeta>
                                            <Styled.ProductPrice>
                                                ${product.price.toLocaleString()}
                                            </Styled.ProductPrice>
                                            <Styled.ProductRating>
                                                <StarIcon sx={{ fontSize: 16 }} />
                                                {product.rating?.toFixed(1) || 'N/A'}
                                            </Styled.ProductRating>
                                        </Styled.ProductMeta>
                                        <Styled.AddToCartButton
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Add to cart logic
                                            }}
                                            disabled={product.quantity === 0}
                                        >
                                            <ShoppingCartIcon sx={{ fontSize: 16, mr: 1 }} />
                                            Add to Cart
                                        </Styled.AddToCartButton>
                                    </Styled.ProductInfo>
                                </Styled.ProductCardWrapper>
                            ))}
                        </Styled.ProductsGrid>

                        {/* Pagination */}
                        <Styled.PaginationContainer>
                            {currentPage > 1 && (
                                <Styled.PaginationButton onClick={handleFirstPage}>
                                    <FirstPageIcon sx={{ fontSize: 20 }} />
                                    First
                                </Styled.PaginationButton>
                            )}
                            <Styled.PaginationButton
                                disabled={!hasPrevPage}
                                onClick={handlePrevPage}
                            >
                                <ChevronLeftIcon sx={{ fontSize: 20 }} />
                                Previous
                            </Styled.PaginationButton>

                            <Styled.PageInfo>Page {currentPage}</Styled.PageInfo>

                            <Styled.PaginationButton
                                disabled={!hasNextPage}
                                onClick={handleNextPage}
                            >
                                Next
                                <ChevronRightIcon sx={{ fontSize: 20 }} />
                            </Styled.PaginationButton>
                        </Styled.PaginationContainer>
                    </>
                )}
            </Styled.ContentArea>
        </Styled.PageContainer>
    );
};

export default ProductsPage;

