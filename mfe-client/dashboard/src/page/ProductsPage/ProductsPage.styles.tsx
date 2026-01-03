import { styled, Box, Typography, Button } from '@mui/material';

export const PageContainer = styled(Box)({
    display: 'flex',
    gap: 24,
    padding: '24px 40px',
    minHeight: 'calc(100vh - 80px)',
    backgroundColor: '#f8f9fa',

    '@media (max-width: 900px)': {
        flexDirection: 'column',
        padding: '16px',
    },
});

// Left Sidebar
export const FilterSidebar = styled(Box)({
    width: 280,
    flexShrink: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    height: 'fit-content',
    position: 'sticky',
    top: 24,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',

    '@media (max-width: 900px)': {
        width: '100%',
        position: 'static',
    },
});

export const FilterTitle = styled(Typography)({
    fontSize: 20,
    fontWeight: 600,
    color: '#212529',
    marginBottom: 24,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
});

export const FilterSection = styled(Box)({
    marginBottom: 24,
    paddingBottom: 24,
    borderBottom: '1px solid #e9ecef',

    '&:last-child': {
        marginBottom: 0,
        paddingBottom: 0,
        borderBottom: 'none',
    },
});

export const FilterLabel = styled(Typography)({
    fontSize: 14,
    fontWeight: 600,
    color: '#495057',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
});

export const CategoryButton = styled(Button)<{ selected?: boolean }>(({ selected }) => ({
    justifyContent: 'flex-start',
    width: '100%',
    padding: '10px 14px',
    marginBottom: 6,
    borderRadius: 8,
    textTransform: 'capitalize',
    fontSize: 14,
    fontWeight: selected ? 600 : 400,
    color: selected ? '#fff' : '#495057',
    backgroundColor: selected ? '#228be6' : '#f8f9fa',
    border: 'none',

    '&:hover': {
        backgroundColor: selected ? '#1c7ed6' : '#e9ecef',
    },
}));

export const PriceInputContainer = styled(Box)({
    display: 'flex',
    gap: 12,
    alignItems: 'center',
});

export const PriceInput = styled('input')({
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #dee2e6',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',

    '&:focus': {
        borderColor: '#228be6',
    },

    '&::placeholder': {
        color: '#adb5bd',
    },
});

export const RatingContainer = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
});

export const RatingButton = styled(Button)<{ selected?: boolean }>(({ selected }) => ({
    justifyContent: 'flex-start',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 14,
    color: selected ? '#fff' : '#495057',
    backgroundColor: selected ? '#fab005' : '#f8f9fa',
    border: 'none',

    '&:hover': {
        backgroundColor: selected ? '#f59f00' : '#e9ecef',
    },
}));

export const FilterActions = styled(Box)({
    display: 'flex',
    gap: 12,
    marginTop: 24,
});

export const ApplyButton = styled(Button)({
    flex: 1,
    padding: '12px 16px',
    backgroundColor: '#228be6',
    color: '#fff',
    borderRadius: 8,
    fontWeight: 600,
    textTransform: 'none',

    '&:hover': {
        backgroundColor: '#1c7ed6',
    },
});

export const ResetButton = styled(Button)({
    padding: '12px 16px',
    backgroundColor: '#f8f9fa',
    color: '#495057',
    borderRadius: 8,
    fontWeight: 500,
    textTransform: 'none',

    '&:hover': {
        backgroundColor: '#e9ecef',
    },
});

// Right Content Area
export const ContentArea = styled(Box)({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
});

export const ContentHeader = styled(Box)({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: '16px 20px',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',

    '@media (max-width: 600px)': {
        flexDirection: 'column',
        gap: 16,
        alignItems: 'stretch',
    },
});

export const SearchContainer = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: '8px 16px',
    flex: 1,
    maxWidth: 400,

    '@media (max-width: 600px)': {
        maxWidth: '100%',
    },
});

export const SearchInput = styled('input')({
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: 14,
    padding: '4px 8px',

    '&::placeholder': {
        color: '#adb5bd',
    },
});

export const SortSelect = styled('select')({
    padding: '10px 16px',
    border: '1px solid #dee2e6',
    borderRadius: 8,
    fontSize: 14,
    backgroundColor: '#fff',
    cursor: 'pointer',
    outline: 'none',

    '&:focus': {
        borderColor: '#228be6',
    },
});

export const ResultsInfo = styled(Typography)({
    fontSize: 14,
    color: '#868e96',
});

// Products Grid
export const ProductsGrid = styled(Box)({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 24,

    '@media (max-width: 600px)': {
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16,
    },
});

export const ProductCardWrapper = styled(Box)({
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',

    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
    },
});

export const ProductImage = styled('img')({
    width: '100%',
    height: 220,
    objectFit: 'cover',
    backgroundColor: '#f8f9fa',
});

export const ProductInfo = styled(Box)({
    padding: 16,
});

export const ProductCategory = styled(Typography)({
    fontSize: 11,
    fontWeight: 500,
    color: '#228be6',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: 6,
});

export const ProductTitle = styled(Typography)({
    fontSize: 15,
    fontWeight: 500,
    color: '#212529',
    marginBottom: 8,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    lineHeight: 1.4,
    minHeight: '2.8em',
});

export const ProductMeta = styled(Box)({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
});

export const ProductPrice = styled(Typography)({
    fontSize: 18,
    fontWeight: 700,
    color: '#212529',
});

export const ProductRating = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
    color: '#fab005',
    fontWeight: 500,
});

export const AddToCartButton = styled(Button)({
    width: '100%',
    marginTop: 12,
    padding: '10px 16px',
    backgroundColor: '#f1f3f5',
    color: '#495057',
    borderRadius: 8,
    fontWeight: 500,
    textTransform: 'none',
    fontSize: 13,

    '&:hover': {
        backgroundColor: '#212529',
        color: '#fff',
    },
});

export const StockBadge = styled(Box)<{ inStock: boolean }>(({ inStock }) => ({
    position: 'absolute',
    top: 12,
    right: 12,
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    backgroundColor: inStock ? '#d3f9d8' : '#ffe3e3',
    color: inStock ? '#2f9e44' : '#e03131',
}));

// Pagination
export const PaginationContainer = styled(Box)({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: '24px 0',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
});

export const PaginationButton = styled(Button)<{ disabled?: boolean }>(({ disabled }) => ({
    padding: '10px 20px',
    backgroundColor: disabled ? '#e9ecef' : '#228be6',
    color: disabled ? '#adb5bd' : '#fff',
    borderRadius: 8,
    fontWeight: 500,
    textTransform: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',

    '&:hover': {
        backgroundColor: disabled ? '#e9ecef' : '#1c7ed6',
    },
}));

export const PageInfo = styled(Typography)({
    fontSize: 14,
    color: '#495057',
    fontWeight: 500,
});

// Loading State
export const LoadingContainer = styled(Box)({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
});

// Empty State
export const EmptyState = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    textAlign: 'center',
});

export const EmptyIcon = styled(Box)({
    fontSize: 64,
    marginBottom: 16,
    color: '#dee2e6',
});

export const EmptyTitle = styled(Typography)({
    fontSize: 20,
    fontWeight: 600,
    color: '#495057',
    marginBottom: 8,
});

export const EmptyText = styled(Typography)({
    fontSize: 14,
    color: '#868e96',
});

