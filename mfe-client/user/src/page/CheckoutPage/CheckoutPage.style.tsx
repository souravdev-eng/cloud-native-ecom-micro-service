import { styled, Typography, TextField, Select } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const PageContainer = styled('div')({
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    padding: '40px 20px',
});

export const ContentWrapper = styled('div')({
    maxWidth: 1100,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: 40,
    '@media (max-width: 960px)': {
        gridTemplateColumns: '1fr',
    },
});

export const PageHeader = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
    maxWidth: 1100,
    margin: '0 auto 32px',
});

export const BackButton = styled('button')({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#fff',
    color: '#1a1a2e',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: '#1a1a2e',
        color: '#fff',
    },
});

export const PageTitle = styled(Typography)({
    fontSize: 28,
    fontWeight: 600,
    color: '#1a1a2e',
    fontFamily: '"Playfair Display", serif',
});

// Stepper
export const StepperContainer = styled('div')({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
    maxWidth: 500,
    margin: '0 auto 40px',
});

export const StepItem = styled('div')<{ active?: boolean; completed?: boolean }>(
    ({ active, completed }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    })
);

export const StepCircle = styled('div')<{ active?: boolean; completed?: boolean }>(
    ({ active, completed }) => ({
        width: 32,
        height: 32,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: 600,
        backgroundColor: completed ? '#10b981' : active ? '#1a1a2e' : '#e9ecef',
        color: completed || active ? '#fff' : '#868e96',
        transition: 'all 0.3s ease',
    })
);

export const StepLabel = styled(Typography)<{ active?: boolean; completed?: boolean }>(
    ({ active, completed }) => ({
        fontSize: 14,
        fontWeight: active || completed ? 600 : 400,
        color: active || completed ? '#1a1a2e' : '#868e96',
        '@media (max-width: 600px)': {
            display: 'none',
        },
    })
);

export const StepConnector = styled('div')<{ completed?: boolean }>(({ completed }) => ({
    width: 60,
    height: 2,
    backgroundColor: completed ? '#10b981' : '#e9ecef',
    margin: '0 8px',
    transition: 'background-color 0.3s ease',
    '@media (max-width: 600px)': {
        width: 30,
    },
}));

// Form Section
export const FormSection = styled('div')({
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
});

export const SectionTitle = styled(Typography)({
    fontSize: 20,
    fontWeight: 600,
    color: '#1a1a2e',
    marginBottom: 24,
    fontFamily: '"Playfair Display", serif',
});

export const FormGrid = styled('div')({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
    '@media (max-width: 600px)': {
        gridTemplateColumns: '1fr',
    },
});

export const FormField = styled('div')<{ fullWidth?: boolean }>(({ fullWidth }) => ({
    gridColumn: fullWidth ? '1 / -1' : 'auto',
}));

export const StyledTextField = styled(TextField)({
    '& .MuiOutlinedInput-root': {
        borderRadius: 10,
        backgroundColor: '#fafafa',
        '&:hover fieldset': {
            borderColor: '#1a1a2e',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#1a1a2e',
        },
    },
    '& .MuiInputLabel-root.Mui-focused': {
        color: '#1a1a2e',
    },
});

export const StyledSelect = styled(Select)({
    borderRadius: 10,
    backgroundColor: '#fafafa',
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#e9ecef',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#1a1a2e',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#1a1a2e',
    },
});

// Card Element Wrapper
export const CardElementWrapper = styled('div')({
    padding: '16px 14px',
    backgroundColor: '#fafafa',
    borderRadius: 10,
    border: '1px solid #e9ecef',
    transition: 'border-color 0.2s ease',
    '&:focus-within': {
        borderColor: '#1a1a2e',
    },
});

export const CardBrands = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    '& img': {
        height: 24,
        opacity: 0.7,
    },
});

// Order Summary
export const SummarySection = styled('div')({
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
    height: 'fit-content',
    position: 'sticky',
    top: 20,
});

export const SummaryTitle = styled(Typography)({
    fontSize: 20,
    fontWeight: 600,
    color: '#1a1a2e',
    marginBottom: 20,
    fontFamily: '"Playfair Display", serif',
});

export const SummaryItem = styled('div')({
    display: 'flex',
    gap: 16,
    padding: '16px 0',
    borderBottom: '1px solid #f1f3f4',
    '&:last-of-type': {
        borderBottom: 'none',
    },
});

export const SummaryItemImage = styled('img')({
    width: 64,
    height: 64,
    objectFit: 'contain',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
});

export const SummaryItemDetails = styled('div')({
    flex: 1,
});

export const SummaryItemTitle = styled(Typography)({
    fontSize: 14,
    fontWeight: 500,
    color: '#1a1a2e',
    marginBottom: 4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
});

export const SummaryItemMeta = styled(Typography)({
    fontSize: 13,
    color: '#868e96',
});

export const SummaryItemPrice = styled(Typography)({
    fontSize: 14,
    fontWeight: 600,
    color: '#1a1a2e',
    textAlign: 'right',
});

export const SummaryDivider = styled('div')({
    height: 1,
    backgroundColor: '#e9ecef',
    margin: '16px 0',
});

export const SummaryRow = styled('div')<{ isTotal?: boolean }>(({ isTotal }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    padding: isTotal ? '16px 0 0' : '8px 0',
    borderTop: isTotal ? '2px solid #1a1a2e' : 'none',
    marginTop: isTotal ? 8 : 0,
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

// Buttons
export const ButtonGroup = styled('div')({
    display: 'flex',
    gap: 12,
    marginTop: 28,
});

export const PrimaryButton = styled('button')<{ fullWidth?: boolean }>(({ fullWidth }) => ({
    flex: fullWidth ? 1 : 'none',
    padding: '14px 28px',
    backgroundColor: '#1a1a2e',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    '&:hover:not(:disabled)': {
        backgroundColor: '#2d2d44',
        transform: 'translateY(-1px)',
    },
    '&:disabled': {
        backgroundColor: '#adb5bd',
        cursor: 'not-allowed',
    },
}));

export const SecondaryButton = styled('button')({
    padding: '14px 28px',
    backgroundColor: 'transparent',
    border: '1px solid #e9ecef',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 500,
    color: '#495057',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
        borderColor: '#1a1a2e',
        color: '#1a1a2e',
    },
});

// Success State
export const SuccessContainer = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '60px 20px',
});

export const SuccessIcon = styled('div')({
    width: 80,
    height: 80,
    borderRadius: '50%',
    backgroundColor: '#d3f9d8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    animation: 'scaleIn 0.5s ease',
    '@keyframes scaleIn': {
        from: {
            transform: 'scale(0)',
            opacity: 0,
        },
        to: {
            transform: 'scale(1)',
            opacity: 1,
        },
    },
});

export const SuccessTitle = styled(Typography)({
    fontSize: 28,
    fontWeight: 600,
    color: '#1a1a2e',
    marginBottom: 12,
    fontFamily: '"Playfair Display", serif',
});

export const SuccessText = styled(Typography)({
    fontSize: 16,
    color: '#495057',
    marginBottom: 8,
});

export const OrderId = styled(Typography)({
    fontSize: 14,
    color: '#868e96',
    marginBottom: 32,
    '& span': {
        fontWeight: 600,
        color: '#1a1a2e',
    },
});

export const ContinueShoppingLink = styled(RouterLink)({
    display: 'inline-block',
    padding: '14px 32px',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    color: '#fff',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: '#2d2d44',
        transform: 'translateY(-1px)',
    },
});

// Error Alert
export const ErrorAlert = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 18px',
    backgroundColor: '#fff5f5',
    borderRadius: 10,
    border: '1px solid #ffc9c9',
    marginBottom: 20,
    color: '#c92a2a',
    fontSize: 14,
});

// Loading
export const LoadingContainer = styled('div')({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
});

// Secure Badge
export const SecureBadge = styled('div')({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    color: '#868e96',
    fontSize: 12,
});

