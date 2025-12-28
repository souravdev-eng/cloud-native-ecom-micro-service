import React from 'react';
import TuneIcon from '@mui/icons-material/TuneRounded';
import StarIcon from '@mui/icons-material/StarRounded';
import {
    FilterSidebar,
    FilterTitle,
    FilterSection,
    FilterLabel,
    CategoryButton,
    PriceInputContainer,
    PriceInput,
    RatingContainer,
    RatingButton,
    FilterActions,
    ApplyButton,
    ResetButton,
} from '../../page/ProductsPage/ProductsPage.styles';
import { Filters } from '../../page/ProductsPage/ProductsPage.hook';

interface ProductFiltersProps {
    filters: Filters;
    categories: readonly string[];
    updateFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
    resetFilters: () => void;
    applyFilters: () => void;
}

const RATING_OPTIONS = [
    { value: 4, label: '4+ Stars' },
    { value: 3, label: '3+ Stars' },
    { value: 2, label: '2+ Stars' },
    { value: 0, label: 'All Ratings' },
];

const ProductFilters: React.FC<ProductFiltersProps> = ({
    filters,
    categories,
    updateFilter,
    resetFilters,
    applyFilters,
}) => {
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    };

    return (
        <FilterSidebar>
            <FilterTitle>
                <TuneIcon /> Filters
            </FilterTitle>

            {/* Categories */}
            <FilterSection>
                <FilterLabel>Category</FilterLabel>
                <CategoryButton
                    selected={filters.category === ''}
                    onClick={() => updateFilter('category', '')}
                >
                    All Categories
                </CategoryButton>
                {categories.map((category) => (
                    <CategoryButton
                        key={category}
                        selected={filters.category === category}
                        onClick={() => updateFilter('category', category)}
                    >
                        {category}
                    </CategoryButton>
                ))}
            </FilterSection>

            {/* Price Range */}
            <FilterSection>
                <FilterLabel>Price Range</FilterLabel>
                <PriceInputContainer>
                    <PriceInput
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) =>
                            updateFilter('minPrice', e.target.value ? Number(e.target.value) : '')
                        }
                        onKeyPress={handleKeyPress}
                    />
                    <span style={{ color: '#adb5bd' }}>—</span>
                    <PriceInput
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) =>
                            updateFilter('maxPrice', e.target.value ? Number(e.target.value) : '')
                        }
                        onKeyPress={handleKeyPress}
                    />
                </PriceInputContainer>
            </FilterSection>

            {/* Rating */}
            <FilterSection>
                <FilterLabel>Rating</FilterLabel>
                <RatingContainer>
                    {RATING_OPTIONS.map((option) => (
                        <RatingButton
                            key={option.value}
                            selected={filters.minRating === option.value}
                            onClick={() => updateFilter('minRating', option.value)}
                        >
                            {option.value > 0 && (
                                <>
                                    {Array.from({ length: option.value }).map((_, i) => (
                                        <StarIcon key={i} sx={{ fontSize: 16 }} />
                                    ))}
                                    {' '}
                                </>
                            )}
                            {option.label}
                        </RatingButton>
                    ))}
                </RatingContainer>
            </FilterSection>

            {/* Actions */}
            <FilterActions>
                <ResetButton onClick={resetFilters}>Reset</ResetButton>
                <ApplyButton onClick={applyFilters}>Apply Filters</ApplyButton>
            </FilterActions>
        </FilterSidebar>
    );
};

export default ProductFilters;

