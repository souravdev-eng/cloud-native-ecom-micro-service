import { Box, styled, Typography } from '@mui/material';

export const Container = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    cursor: 'pointer',
    transition: 'transform 0.22s ease, box-shadow 0.22s ease',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',

    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 14px 28px rgba(0,0,0,0.1)',
    },
    '&:hover .product-btn': {
        backgroundColor: '#212529',
        color: '#fff',
    },
});

export const ImageWrapper = styled('div')({
    position: 'relative',
    width: '100%',
    paddingTop: '100%',
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
});

export const ProductImage = styled('img')({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center',
    padding: 12,
    transition: 'transform 0.3s ease',
    boxSizing: 'border-box',

    '.product-card:hover &': {
        transform: 'scale(1.04)',
    },
});

export const SaleChip = styled(Box)({
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#d6336c',
    color: '#fff',
    borderRadius: 6,
    padding: '3px 8px',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    zIndex: 1,
});

export const ProductContent = styled('div')({
    padding: '12px 14px 4px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
});

export const ProductTag = styled(Typography)({
    fontSize: 10,
    fontWeight: 700,
    color: '#228be6',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    lineHeight: 1,
});

export const ProductTitle = styled(Typography)({
    fontSize: 14,
    fontWeight: 500,
    color: '#212529',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    lineHeight: 1.45,
    minHeight: '2.9em',
});

export const PriceRatingRow = styled(Box)({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
});

export const ProductPrice = styled(Typography)({
    fontSize: 16,
    fontWeight: 800,
    color: '#212529',
    letterSpacing: '-0.2px',
});

export const RatingChip = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 12,
    fontWeight: 600,
    color: '#fab005',
});

export const Button = styled('div')({
    margin: '10px 14px 14px',
    padding: '9px 0',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderRadius: 8,
    backgroundColor: '#f1f3f5',
    color: '#495057',
    transition: 'background 0.2s, color 0.2s',
    cursor: 'pointer',
});
