import { styled, Typography, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const PageContainer = styled('div')({
    minHeight: '100vh',
    backgroundColor: '#fafafa',
    padding: '40px 20px',
});

export const ContentWrapper = styled('div')({
    maxWidth: 1200,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: 32,
    '@media (max-width: 900px)': {
        gridTemplateColumns: '1fr',
    },
});

export const PageTitle = styled(Typography)({
    fontSize: 28,
    fontWeight: 600,
    color: '#1a1a2e',
    marginBottom: 8,
    fontFamily: '"Playfair Display", serif',
});

export const ItemCount = styled(Typography)({
    fontSize: 14,
    color: '#868e96',
    marginBottom: 32,
});

// Cart Items Section
export const CartSection = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
});

export const CartItem = styled('div')({
    display: 'flex',
    gap: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    transition: 'box-shadow 0.2s ease',
    '&:hover': {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    },
});

export const ProductImage = styled('img')({
    width: 120,
    height: 120,
    objectFit: 'contain',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    flexShrink: 0,
});

export const ProductDetails = styled('div')({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
});

export const ProductTitle = styled(Typography)({
    fontSize: 16,
    fontWeight: 500,
    color: '#1a1a2e',
    marginBottom: 4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
});

export const ProductPrice = styled(Typography)({
    fontSize: 18,
    fontWeight: 600,
    color: '#2d3436',
});

export const ProductSubtotal = styled(Typography)({
    fontSize: 13,
    color: '#868e96',
    marginTop: 2,
});

export const QuantityWrapper = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
});

export const QuantityControl = styled('div')({
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #e9ecef',
    borderRadius: 8,
    overflow: 'hidden',
});

export const QuantityButton = styled(IconButton)({
    borderRadius: 0,
    padding: '8px 12px',
    color: '#495057',
    '&:hover': {
        backgroundColor: '#f8f9fa',
    },
    '&:disabled': {
        color: '#dee2e6',
    },
});

export const QuantityValue = styled(Typography)({
    fontSize: 14,
    fontWeight: 500,
    color: '#1a1a2e',
    minWidth: 40,
    textAlign: 'center',
    padding: '0 8px',
});

export const RemoveButton = styled(IconButton)({
    color: '#e03131',
    padding: 8,
    marginLeft: 'auto',
    '&:hover': {
        backgroundColor: '#fff5f5',
    },
});

// Order Summary Section
export const SummarySection = styled('div')({
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 28,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    height: 'fit-content',
    position: 'sticky',
    top: 20,
});

export const SummaryTitle = styled(Typography)({
    fontSize: 20,
    fontWeight: 600,
    color: '#1a1a2e',
    marginBottom: 24,
    fontFamily: '"Playfair Display", serif',
});

export const SummaryRow = styled('div')<{ isTotal?: boolean }>(({ isTotal }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: isTotal ? '16px 0 0' : '12px 0',
    borderTop: isTotal ? '2px solid #1a1a2e' : 'none',
    marginTop: isTotal ? 16 : 0,
}));

export const SummaryLabel = styled(Typography)<{ isTotal?: boolean }>(({ isTotal }) => ({
    fontSize: isTotal ? 16 : 14,
    fontWeight: isTotal ? 600 : 400,
    color: isTotal ? '#1a1a2e' : '#495057',
}));

export const SummaryValue = styled(Typography)<{ isTotal?: boolean }>(({ isTotal }) => ({
    fontSize: isTotal ? 22 : 14,
    fontWeight: isTotal ? 700 : 500,
    color: '#1a1a2e',
}));

export const PromoCodeWrapper = styled('div')({
    display: 'flex',
    gap: 8,
    marginTop: 20,
    marginBottom: 20,
});

export const PromoInput = styled('input')({
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #e9ecef',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s ease',
    '&:focus': {
        borderColor: '#1a1a2e',
    },
    '&::placeholder': {
        color: '#adb5bd',
    },
});

export const ApplyButton = styled('button')({
    padding: '12px 20px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: '#495057',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: '#e9ecef',
    },
});

export const CheckoutButton = styled('button')({
    width: '100%',
    padding: '16px 24px',
    backgroundColor: '#1a1a2e',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: 8,
    '&:hover': {
        backgroundColor: '#2d2d44',
        transform: 'translateY(-1px)',
    },
    '&:active': {
        transform: 'translateY(0)',
    },
    '&:disabled': {
        backgroundColor: '#868e96',
        cursor: 'not-allowed',
        transform: 'none',
    },
});

export const SecureCheckout = styled('div')({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    color: '#868e96',
    fontSize: 12,
});

// Empty Cart State
export const EmptyCartContainer = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    textAlign: 'center',
    padding: 40,
});

export const EmptyCartIcon = styled('div')({
    fontSize: 80,
    marginBottom: 24,
    opacity: 0.6,
});

export const EmptyCartTitle = styled(Typography)({
    fontSize: 24,
    fontWeight: 600,
    color: '#1a1a2e',
    marginBottom: 8,
    fontFamily: '"Playfair Display", serif',
});

export const EmptyCartText = styled(Typography)({
    fontSize: 14,
    color: '#868e96',
    marginBottom: 24,
});

export const ShopNowButton = styled(RouterLink)({
    display: 'inline-block',
    padding: '14px 32px',
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: '#2d2d44',
        transform: 'translateY(-1px)',
    },
});

// Loading State
export const LoadingContainer = styled('div')({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
});

export const CartItemSkeleton = styled('div')({
    display: 'flex',
    gap: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    animation: 'pulse 1.5s ease-in-out infinite',
    '@keyframes pulse': {
        '0%, 100%': {
            opacity: 1,
        },
        '50%': {
            opacity: 0.5,
        },
    },
});

export const SkeletonImage = styled('div')({
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
});

export const SkeletonText = styled('div')<{ width?: string | number }>(({ width = '100%' }) => ({
    height: 16,
    borderRadius: 4,
    backgroundColor: '#e9ecef',
    width: typeof width === 'number' ? `${width}px` : width,
    marginBottom: 8,
}));

// Error Toast/Alert
export const ErrorToast = styled('div')({
    position: 'fixed',
    top: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: '16px 20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    maxWidth: 400,
    zIndex: 1000,
    borderLeft: '4px solid #e03131',
    animation: 'slideIn 0.3s ease',
    '@keyframes slideIn': {
        from: {
            transform: 'translateX(100%)',
            opacity: 0,
        },
        to: {
            transform: 'translateX(0)',
            opacity: 1,
        },
    },
});

export const ErrorIconWrapper = styled('div')({
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: '#fff5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: '#e03131',
});

export const ErrorContent = styled('div')({
    flex: 1,
});

export const ErrorTitle = styled(Typography)({
    fontSize: 14,
    fontWeight: 600,
    color: '#1a1a2e',
    marginBottom: 4,
});

export const ErrorMessage = styled(Typography)({
    fontSize: 13,
    color: '#495057',
    lineHeight: 1.4,
});

export const ErrorCloseButton = styled(IconButton)({
    padding: 4,
    marginLeft: 8,
    color: '#868e96',
    '&:hover': {
        backgroundColor: '#f8f9fa',
    },
});

