import { Box, styled, Typography } from '@mui/material';

export const Container = styled(Box)({
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: '10px 0',
    cursor: 'pointer',
    borderBottom: '1px solid #f1f3f5',
    transition: 'opacity 0.15s',

    '&:last-child': { borderBottom: 'none' },
    '&:hover': { opacity: 0.75 },
});

export const ImageBox = styled(Box)({
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    flexShrink: 0,
});

export const Image = styled('img')({
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    padding: 4,
    boxSizing: 'border-box',
});

export const Info = styled(Box)({
    flex: 1,
    minWidth: 0,
});

export const Title = styled(Typography)({
    fontSize: 13,
    fontWeight: 500,
    color: '#212529',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
});

export const Price = styled(Typography)({
    fontSize: 13,
    fontWeight: 700,
    color: '#228be6',
    marginTop: 3,
});
