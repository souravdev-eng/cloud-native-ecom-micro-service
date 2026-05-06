import { styled, Box, Typography, Button, Chip } from '@mui/material';

// ── Page shell ────────────────────────────────────────────────────────────────

export const PageContainer = styled(Box)({
    display: 'flex',
    gap: 24,
    padding: '24px 40px',
    minHeight: 'calc(100vh - 80px)',
    backgroundColor: '#f1f3f5',

    '@media (max-width: 900px)': { flexDirection: 'column', padding: '16px' },
});

// ── Sidebar ───────────────────────────────────────────────────────────────────

export const FilterSidebar = styled(Box)({
    width: 256,
    flexShrink: 0,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    height: 'fit-content',
    position: 'sticky',
    top: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',

    '@media (max-width: 900px)': { width: '100%', position: 'static' },
});

export const FilterHeader = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 20px 14px',
    borderBottom: '1px solid #f1f3f5',
});

export const FilterTitle = styled(Typography)({
    fontSize: 14,
    fontWeight: 700,
    color: '#212529',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
});

export const FilterBadge = styled(Box)({
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#228be6',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 6px',
});

export const ClearAllBtn = styled('button')({
    fontSize: 12,
    fontWeight: 600,
    color: '#868e96',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'color 0.15s',
    '&:hover': { color: '#e03131' },
});

export const FilterBody = styled(Box)({
    padding: '0 0 16px',
});

export const FilterSection = styled(Box)({
    padding: '16px 20px',
    borderBottom: '1px solid #f8f9fa',

    '&:last-child': { borderBottom: 'none' },
});

export const FilterLabel = styled(Typography)({
    fontSize: 11,
    fontWeight: 700,
    color: '#adb5bd',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.9px',
});

// Category pills
export const CategoryGrid = styled(Box)({
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
});

const CATEGORY_COLORS: Record<string, { bg: string; active: string; text: string }> = {
    phone:    { bg: '#e7f5ff', active: '#228be6', text: '#1971c2' },
    earphone: { bg: '#f3f0ff', active: '#7950f2', text: '#6741d9' },
    book:     { bg: '#fff3bf', active: '#f08c00', text: '#e67700' },
    fashions: { bg: '#fff0f6', active: '#e64980', text: '#c2255c' },
    other:    { bg: '#f1f3f5', active: '#495057', text: '#343a40' },
    all:      { bg: '#f1f3f5', active: '#212529', text: '#212529' },
};

export const CategoryPill = styled(Button)<{ catkey?: string; selected?: boolean }>(
    ({ catkey = 'other', selected }) => {
        const c = CATEGORY_COLORS[catkey] ?? CATEGORY_COLORS.other;
        return {
            padding: '5px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'capitalize',
            minWidth: 'auto',
            backgroundColor: selected ? c.active : c.bg,
            color: selected ? '#fff' : c.text,
            border: 'none',
            lineHeight: 1.5,
            transition: 'background 0.15s, color 0.15s, transform 0.1s',
            '&:hover': {
                backgroundColor: c.active,
                color: '#fff',
                transform: 'scale(1.04)',
            },
        };
    },
);

// Price range
export const PriceInputRow = styled(Box)({
    display: 'flex',
    gap: 8,
    alignItems: 'center',
});

export const PriceInput = styled('input')({
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #dee2e6',
    borderRadius: 8,
    fontSize: 13,
    outline: 'none',
    backgroundColor: '#f8f9fa',
    color: '#212529',
    transition: 'border-color 0.2s, background 0.2s',

    '&:focus': { borderColor: '#228be6', backgroundColor: '#fff' },
    '&::placeholder': { color: '#ced4da' },
});

export const PriceSeparator = styled('span')({
    color: '#dee2e6',
    fontWeight: 600,
    fontSize: 14,
    flexShrink: 0,
});

// Rating buttons
export const RatingList = styled(Box)({ display: 'flex', flexDirection: 'column', gap: 3 });

export const RatingRow = styled(Box)<{ selected?: boolean }>(({ selected }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    backgroundColor: selected ? '#fff9db' : 'transparent',
    border: `1px solid ${selected ? '#ffd43b' : 'transparent'}`,
    transition: 'background 0.15s, border-color 0.15s',

    '&:hover': { backgroundColor: '#fff9db', borderColor: '#ffd43b' },
}));

export const StarFill = styled(Box)<{ filled: boolean }>(({ filled }) => ({
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: filled ? '#fab005' : '#e9ecef',
    display: 'inline-block',
    flexShrink: 0,
}));

export const RatingLabel = styled(Typography)({
    fontSize: 12,
    fontWeight: 500,
    color: '#495057',
    flex: 1,
});

export const RatingCheck = styled(Box)({
    width: 16,
    height: 16,
    borderRadius: '50%',
    backgroundColor: '#228be6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
});

// In Stock toggle
export const ToggleRow = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
});

export const ToggleLabel = styled(Typography)({
    fontSize: 13,
    fontWeight: 500,
    color: '#495057',
});

export const Toggle = styled(Box)<{ on: boolean }>(({ on }) => ({
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: on ? '#228be6' : '#dee2e6',
    position: 'relative',
    transition: 'background 0.22s',
    flexShrink: 0,
    cursor: 'pointer',

    '&::after': {
        content: '""',
        position: 'absolute',
        top: 3,
        left: on ? 21 : 3,
        width: 16,
        height: 16,
        borderRadius: '50%',
        backgroundColor: '#fff',
        transition: 'left 0.22s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    },
}));

// Apply / Reset
export const FilterActions = styled(Box)({
    display: 'flex',
    gap: 8,
    padding: '16px 20px 4px',
});

export const ApplyButton = styled(Button)({
    flex: 1,
    padding: '10px 14px',
    backgroundColor: '#228be6',
    color: '#fff',
    borderRadius: 8,
    fontWeight: 700,
    textTransform: 'none',
    fontSize: 13,
    '&:hover': { backgroundColor: '#1c7ed6' },
});

export const ResetButton = styled(Button)({
    padding: '10px 14px',
    backgroundColor: 'transparent',
    color: '#868e96',
    borderRadius: 8,
    fontWeight: 600,
    textTransform: 'none',
    fontSize: 13,
    border: '1px solid #dee2e6',
    '&:hover': { backgroundColor: '#f8f9fa', color: '#495057' },
});

// ── Content Area ──────────────────────────────────────────────────────────────

export const ContentArea = styled(Box)({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    minWidth: 0,
});

export const ContentHeader = styled(Box)({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: '12px 16px',
    borderRadius: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    gap: 12,
    flexWrap: 'wrap',
});

export const SearchContainer = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: 8,
    padding: '6px 12px',
    flex: 1,
    maxWidth: 360,
    transition: 'border-color 0.2s',

    '&:focus-within': { borderColor: '#228be6', backgroundColor: '#fff' },
    '@media (max-width: 600px)': { maxWidth: '100%' },
});

export const SearchInput = styled('input')({
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: 14,
    padding: '2px 8px',
    color: '#212529',
    '&::placeholder': { color: '#adb5bd' },
});

export const RightControls = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
});

export const ResultsInfo = styled(Typography)({
    fontSize: 13,
    color: '#adb5bd',
    whiteSpace: 'nowrap',
});

export const SortSelect = styled('select')({
    padding: '7px 12px',
    border: '1px solid #dee2e6',
    borderRadius: 8,
    fontSize: 13,
    backgroundColor: '#fff',
    cursor: 'pointer',
    outline: 'none',
    color: '#495057',
    '&:focus': { borderColor: '#228be6' },
});

// ── Active filter chips ───────────────────────────────────────────────────────

export const ActiveFiltersRow = styled(Box)({
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
});

export const ActiveChip = styled(Box)({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 10px 4px 12px',
    backgroundColor: '#e7f5ff',
    border: '1px solid #74c0fc',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    color: '#1971c2',
    cursor: 'default',
    userSelect: 'none',
});

export const ChipClose = styled('span')({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
    height: 16,
    borderRadius: '50%',
    backgroundColor: '#74c0fc',
    color: '#fff',
    fontSize: 10,
    cursor: 'pointer',
    lineHeight: 1,
    flexShrink: 0,
    transition: 'background 0.15s',
    '&:hover': { backgroundColor: '#339af0' },
});

export const ClearAll = styled('button')({
    fontSize: 12,
    fontWeight: 600,
    color: '#868e96',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: 6,
    transition: 'color 0.15s',
    '&:hover': { color: '#e03131' },
});

// ── Product Grid ──────────────────────────────────────────────────────────────

export const ProductsGrid = styled(Box)({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 18,

    '@media (max-width: 600px)': { gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 },
});

export const ProductCardWrapper = styled(Box)({
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    transition: 'transform 0.22s ease, box-shadow 0.22s ease',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',

    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 16px 32px rgba(0,0,0,0.1)',
    },
    '&:hover .add-cart-btn': { backgroundColor: '#212529', color: '#fff' },
});

export const ImageWrapper = styled(Box)({
    position: 'relative',
    width: '100%',
    paddingTop: '72%',
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
});

export const ProductImage = styled('img')({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
});

export const StockBadge = styled(Box)<{ inStock: boolean }>(({ inStock }) => ({
    position: 'absolute',
    top: 10,
    right: 10,
    padding: '3px 9px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    backgroundColor: inStock ? 'rgba(211,249,216,0.95)' : 'rgba(255,227,227,0.95)',
    color: inStock ? '#2f9e44' : '#e03131',
    backdropFilter: 'blur(4px)',
}));

export const ProductInfo = styled(Box)({
    padding: '12px 14px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    flex: 1,
});

export const ProductCategory = styled(Typography)({
    fontSize: 10,
    fontWeight: 700,
    color: '#228be6',
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
});

export const ProductTitle = styled(Typography)({
    fontSize: 13,
    fontWeight: 600,
    color: '#212529',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    lineHeight: 1.45,
    minHeight: '2.9em',
});

export const TagsRow = styled(Box)({
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
});

export const TagChip = styled(Chip)({
    height: 18,
    fontSize: 10,
    borderRadius: 4,
    backgroundColor: '#f1f3f5',
    color: '#868e96',
    '& .MuiChip-label': { padding: '0 6px' },
});

export const ProductMeta = styled(Box)({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
});

export const ProductPrice = styled(Typography)({
    fontSize: 16,
    fontWeight: 800,
    color: '#212529',
    letterSpacing: '-0.3px',
});

export const ProductRating = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 12,
    color: '#fab005',
    fontWeight: 600,
});

export const AddToCartButton = styled(Button)({
    width: '100%',
    marginTop: 8,
    padding: '8px 14px',
    backgroundColor: '#f1f3f5',
    color: '#495057',
    borderRadius: 8,
    fontWeight: 600,
    textTransform: 'none',
    fontSize: 13,
    transition: 'background 0.2s, color 0.2s',

    '&:hover': { backgroundColor: '#212529', color: '#fff' },
    '&:disabled': { backgroundColor: '#f1f3f5', color: '#ced4da' },
});

// ── Pagination ────────────────────────────────────────────────────────────────

export const PaginationWrapper = styled(Box)({
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: '16px 24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
});

export const PaginationMeta = styled(Typography)({
    fontSize: 13,
    color: '#adb5bd',
    fontWeight: 500,
});

export const PaginationControls = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: 4,
});

export const PageBtn = styled(Box)<{ active?: boolean; disabled?: boolean }>(
    ({ active, disabled }) => ({
        minWidth: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        transition: 'background 0.15s, color 0.15s',
        padding: '0 10px',

        ...(active
            ? {
                  backgroundColor: '#228be6',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(34,139,230,0.35)',
              }
            : disabled
              ? { backgroundColor: 'transparent', color: '#ced4da', border: '1px solid #e9ecef' }
              : {
                    backgroundColor: 'transparent',
                    color: '#495057',
                    border: '1px solid #dee2e6',
                    '&:hover': { backgroundColor: '#e7f5ff', borderColor: '#74c0fc', color: '#228be6' },
                }),
    }),
);

export const PageDots = styled(Typography)({
    fontSize: 13,
    color: '#adb5bd',
    padding: '0 4px',
    lineHeight: '36px',
});

// ── States ────────────────────────────────────────────────────────────────────

export const LoadingContainer = styled(Box)({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
    backgroundColor: '#fff',
    borderRadius: 14,
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
});

export const EmptyState = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    textAlign: 'center',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
});

export const EmptyIcon = styled(Box)({ fontSize: 64, marginBottom: 16, color: '#dee2e6' });

export const EmptyTitle = styled(Typography)({
    fontSize: 18,
    fontWeight: 700,
    color: '#495057',
    marginBottom: 6,
});

export const EmptyText = styled(Typography)({ fontSize: 14, color: '#868e96' });
