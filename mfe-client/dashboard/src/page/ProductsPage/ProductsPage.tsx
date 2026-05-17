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
import CloseIcon from '@mui/icons-material/CloseRounded';

import { useProductsPage, Product } from './ProductsPage.hook';
import ProductFilters from '../../components/ProductFilters/ProductFilters';
import * as S from './ProductsPage.styles';

const MAX_TAGS = 3;

const ProductsPage: React.FC = () => {
    const navigate = useNavigate();
    const {
        products,
        isLoading,
        meta,
        filters,
        currentPage,
        hasNextPage,
        hasPrevPage,
        activeFilters,
        searchSource,
        parsedFilters,
        handleNextPage,
        handlePrevPage,
        handleFirstPage,
        updateFilter,
        toggleCategory,
        resetFilters,
        applyFilters,
        applyImmediate,
        removeFilter,
    } = useProductsPage();

    const totalPages = meta.limit > 0 ? Math.ceil(meta.count / meta.limit) : 0;

    // Build a compact page-number list: [1] ... [p-1] [p] [p+1] ... [last]
    const pageNumbers = (() => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages: (number | '…')[] = [1];
        if (currentPage > 3) pages.push('…');
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            pages.push(i);
        }
        if (currentPage < totalPages - 2) pages.push('…');
        pages.push(totalPages);
        return pages;
    })();

    return (
        <S.PageContainer>
            <ProductFilters
                filters={filters}
                activeFilterCount={activeFilters.length}
                toggleCategory={toggleCategory}
                updateFilter={updateFilter}
                resetFilters={resetFilters}
                applyFilters={applyFilters}
                applyImmediate={applyImmediate}
            />

            <S.ContentArea>
                {/* Search + sort bar */}
                <S.ContentHeader>
                    <S.SearchContainer>
                        <SearchIcon sx={{ color: '#adb5bd', fontSize: 18, flexShrink: 0 }} />
                        <S.SearchInput
                            type="text"
                            placeholder="Search products…"
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                        />
                    </S.SearchContainer>

                    <S.RightControls>
                        <S.ResultsInfo>{meta.count.toLocaleString()} products</S.ResultsInfo>
                        <S.SortSelect
                            value={filters.sortBy}
                            onChange={(e) => {
                                updateFilter('sortBy', e.target.value);
                                setTimeout(applyFilters, 0);
                            }}
                        >
                            <option value="-_id">Newest first</option>
                            <option value="_id">Oldest first</option>
                            <option value="price">Price: low → high</option>
                            <option value="-price">Price: high → low</option>
                            <option value="-rating">Top rated</option>
                        </S.SortSelect>
                    </S.RightControls>
                </S.ContentHeader>

                {/* Search info bar */}
                {searchSource !== 'listing' && filters.search && (
                    <S.ActiveFiltersRow>
                        <S.ActiveChip>
                            {searchSource === 'elasticsearch' ? '⚡ ES' : '🗂 MongoDB'}
                        </S.ActiveChip>
                        {parsedFilters?.parsedSearchText && (
                            <S.ActiveChip>
                                Search: "{parsedFilters.parsedSearchText}"
                            </S.ActiveChip>
                        )}
                        {parsedFilters?.priceMax && (
                            <S.ActiveChip>
                                Price ≤ ${parsedFilters.priceMax}
                            </S.ActiveChip>
                        )}
                        {parsedFilters?.priceMin && (
                            <S.ActiveChip>
                                Price ≥ ${parsedFilters.priceMin}
                            </S.ActiveChip>
                        )}
                        {parsedFilters?.minRating && (
                            <S.ActiveChip>
                                Rating ≥ {parsedFilters.minRating}★
                            </S.ActiveChip>
                        )}
                        {meta.total !== undefined && (
                            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 'auto' }}>
                                {meta.total} result{meta.total !== 1 ? 's' : ''} found
                            </span>
                        )}
                    </S.ActiveFiltersRow>
                )}

                {/* Active filter chips */}
                {activeFilters.length > 0 && (
                    <S.ActiveFiltersRow>
                        {activeFilters.map(({ key, label }) => (
                            <S.ActiveChip key={`${key}-${label}`}>
                                {label}
                                <S.ChipClose
                                    onClick={() =>
                                        key === 'categories'
                                            ? toggleCategory(label)
                                            : removeFilter(key)
                                    }
                                >
                                    <CloseIcon sx={{ fontSize: 9 }} />
                                </S.ChipClose>
                            </S.ActiveChip>
                        ))}
                        <S.ClearAll onClick={resetFilters}>Clear all</S.ClearAll>
                    </S.ActiveFiltersRow>
                )}

                {/* Grid */}
                {isLoading ? (
                    <S.LoadingContainer>
                        <CircularProgress sx={{ color: '#228be6' }} />
                    </S.LoadingContainer>
                ) : products.length === 0 ? (
                    <S.EmptyState>
                        <S.EmptyIcon>
                            <InventoryIcon sx={{ fontSize: 'inherit' }} />
                        </S.EmptyIcon>
                        <S.EmptyTitle>No products found</S.EmptyTitle>
                        <S.EmptyText>Try adjusting your filters or search terms</S.EmptyText>
                    </S.EmptyState>
                ) : (
                    <>
                        <S.ProductsGrid>
                            {products.map((product: Product) => (
                                <S.ProductCardWrapper
                                    key={product.id}
                                    onClick={() => navigate(`/product/${product.id}`)}
                                >
                                    <S.ImageWrapper>
                                        <S.ProductImage
                                            src={product.image}
                                            alt={product.title}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src =
                                                    'https://via.placeholder.com/300x220?text=No+Image';
                                            }}
                                        />
                                        <S.StockBadge inStock={product.quantity > 0}>
                                            {product.quantity > 0
                                                ? `${product.quantity} left`
                                                : 'Sold out'}
                                        </S.StockBadge>
                                    </S.ImageWrapper>

                                    <S.ProductInfo>
                                        <S.ProductCategory>{product.category}</S.ProductCategory>
                                        <S.ProductTitle>{product.title}</S.ProductTitle>

                                        {product.tags?.length > 0 && (
                                            <S.TagsRow>
                                                {product.tags.slice(0, MAX_TAGS).map((tag) => (
                                                    <S.TagChip key={tag} label={tag} size="small" />
                                                ))}
                                                {product.tags.length > MAX_TAGS && (
                                                    <S.TagChip
                                                        label={`+${product.tags.length - MAX_TAGS}`}
                                                        size="small"
                                                    />
                                                )}
                                            </S.TagsRow>
                                        )}

                                        <S.ProductMeta>
                                            <S.ProductPrice>
                                                ${product.price.toLocaleString()}
                                            </S.ProductPrice>
                                            <S.ProductRating>
                                                <StarIcon sx={{ fontSize: 13 }} />
                                                {product.rating?.toFixed(1) ?? 'N/A'}
                                            </S.ProductRating>
                                        </S.ProductMeta>

                                        <S.AddToCartButton
                                            className="add-cart-btn"
                                            onClick={(e) => e.stopPropagation()}
                                            disabled={product.quantity === 0}
                                            startIcon={<ShoppingCartIcon sx={{ fontSize: 14 }} />}
                                        >
                                            Add to Cart
                                        </S.AddToCartButton>
                                    </S.ProductInfo>
                                </S.ProductCardWrapper>
                            ))}
                        </S.ProductsGrid>

                        {/* Pagination */}
                        <S.PaginationWrapper>
                            <S.PaginationMeta>
                                Page {currentPage}{totalPages > 0 ? ` of ${totalPages}` : ''} · {meta.count.toLocaleString()} results
                            </S.PaginationMeta>

                            <S.PaginationControls>
                                {/* First page */}
                                {currentPage > 2 && (
                                    <S.PageBtn onClick={handleFirstPage} title="First page">
                                        <FirstPageIcon sx={{ fontSize: 16 }} />
                                    </S.PageBtn>
                                )}

                                {/* Prev */}
                                <S.PageBtn disabled={!hasPrevPage} onClick={handlePrevPage}>
                                    <ChevronLeftIcon sx={{ fontSize: 16 }} />
                                    Prev
                                </S.PageBtn>

                                {/* Numbered pages (visible when we can compute totalPages) */}
                                {totalPages > 1 &&
                                    pageNumbers.map((p, i) =>
                                        p === '…' ? (
                                            <S.PageDots key={`dots-${i}`}>…</S.PageDots>
                                        ) : (
                                            <S.PageBtn
                                                key={p}
                                                active={p === currentPage}
                                                onClick={
                                                    p === currentPage
                                                        ? undefined
                                                        : p === 1
                                                            ? handleFirstPage
                                                            : undefined // only first/prev/next navigable via cursor
                                                }
                                                title={`Page ${p}`}
                                            >
                                                {p}
                                            </S.PageBtn>
                                        ),
                                    )}

                                {/* Next */}
                                <S.PageBtn disabled={!hasNextPage} onClick={handleNextPage}>
                                    Next
                                    <ChevronRightIcon sx={{ fontSize: 16 }} />
                                </S.PageBtn>
                            </S.PaginationControls>
                        </S.PaginationWrapper>
                    </>
                )}
            </S.ContentArea>
        </S.PageContainer>
    );
};

export default ProductsPage;
