import { styled, Box, Typography, Button, Chip } from '@mui/material';

export const PageWrapper = styled(Box)({
    minHeight: 'calc(100vh - 80px)',
    backgroundColor: '#f8f9fa',
    padding: '32px 40px',

    '@media (max-width: 900px)': {
        padding: '16px',
    },
});

export const Breadcrumb = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
    fontSize: 14,
    color: '#868e96',

    '& a, & span': {
        cursor: 'pointer',
        transition: 'color 0.15s',
        '&:hover': { color: '#228be6' },
    },
    '& .separator': {
        color: '#dee2e6',
        cursor: 'default',
        '&:hover': { color: '#dee2e6' },
    },
});

export const Container = styled(Box)({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 40,
    maxWidth: 1100,
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',

    '@media (max-width: 900px)': {
        gridTemplateColumns: '1fr',
        padding: 24,
        gap: 24,
    },
});

export const ImageSection = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
});

export const ProductImageContainer = styled(Box)({
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    aspectRatio: '1 / 1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
});

export const ProductImage = styled('img')({
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    padding: 24,
});

export const StockBadge = styled(Box)<{ instock: string }>(({ instock }) => ({
    position: 'absolute',
    top: 16,
    left: 16,
    padding: '5px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    backgroundColor: instock === 'true' ? '#d3f9d8' : '#ffe3e3',
    color: instock === 'true' ? '#2f9e44' : '#e03131',
    backdropFilter: 'blur(4px)',
}));

export const DetailsSection = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
});

export const CategoryBadge = styled(Box)({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: 6,
    backgroundColor: '#e7f5ff',
    color: '#228be6',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    width: 'fit-content',
});

export const ProductTitle = styled(Typography)({
    fontSize: 26,
    fontWeight: 700,
    color: '#212529',
    lineHeight: 1.3,
});

export const RatingRow = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
    color: '#868e96',
});

export const PriceRow = styled(Box)({
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
    padding: '16px 0',
    borderTop: '1px solid #f1f3f5',
    borderBottom: '1px solid #f1f3f5',
});

export const ProductPrice = styled(Typography)({
    fontSize: 32,
    fontWeight: 800,
    color: '#212529',
    letterSpacing: '-0.5px',
});

export const DescriptionLabel = styled(Typography)({
    fontSize: 12,
    fontWeight: 700,
    color: '#868e96',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: 4,
});

export const ProductDescription = styled(Typography)({
    fontSize: 15,
    color: '#495057',
    lineHeight: 1.7,
});

export const TagsRow = styled(Box)({
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
});

export const TagChip = styled(Chip)({
    fontSize: 12,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#f1f3f5',
    color: '#495057',
    '& .MuiChip-label': { padding: '0 10px' },
});

export const QuantityRow = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: 16,
});

export const QuantityLabel = styled(Typography)({
    fontSize: 14,
    fontWeight: 600,
    color: '#495057',
    minWidth: 70,
});

export const QuantityControls = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    border: '1px solid #dee2e6',
    borderRadius: 8,
    overflow: 'hidden',
});

export const QuantityBtn = styled('button')({
    width: 36,
    height: 36,
    border: 'none',
    backgroundColor: '#f8f9fa',
    color: '#495057',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
    '&:hover': { backgroundColor: '#e9ecef' },
    '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
});

export const QuantityValue = styled(Box)({
    width: 48,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 600,
    color: '#212529',
    borderLeft: '1px solid #dee2e6',
    borderRight: '1px solid #dee2e6',
    lineHeight: '36px',
});

export const AddToCartButton = styled(Button)<{ disabled?: boolean }>(({ disabled }) => ({
    width: '100%',
    padding: '14px 24px',
    backgroundColor: disabled ? '#e9ecef' : '#212529',
    color: disabled ? '#adb5bd' : '#fff',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 15,
    textTransform: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.2s, transform 0.1s',
    boxShadow: disabled ? 'none' : '0 4px 12px rgba(33,37,41,0.25)',

    '&:hover': {
        backgroundColor: disabled ? '#e9ecef' : '#1a1a2e',
        transform: disabled ? 'none' : 'translateY(-1px)',
        boxShadow: disabled ? 'none' : '0 6px 16px rgba(33,37,41,0.3)',
    },
    '&:active': {
        transform: 'translateY(0)',
    },
}));

export const LoadingContainer = styled(Box)({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
});
