import { styled, Box, Typography } from '@mui/material';

export const Section = styled(Box)(({ isTint }: { isTint?: boolean }) => ({
    width: '100%',
    backgroundColor: isTint ? '#f8f9fa' : '#ffffff',
    padding: '52px 0 48px',
}));

export const Inner = styled(Box)({
    maxWidth: 1280,
    margin: '0 auto',
    padding: '0 40px',

    '@media (max-width: 768px)': {
        padding: '0 16px',
    },
});

export const SectionHeader = styled(Box)({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
});

export const TitleGroup = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
});

export const SectionEyebrow = styled(Typography)({
    fontSize: 11,
    fontWeight: 700,
    color: '#228be6',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
});

export const SectionTitle = styled(Typography)({
    fontSize: 26,
    fontWeight: 800,
    color: '#212529',
    lineHeight: 1.2,
    letterSpacing: '-0.3px',
});

export const ViewAllLink = styled('button')({
    fontSize: 13,
    fontWeight: 600,
    color: '#228be6',
    background: 'none',
    border: '1px solid #228be6',
    borderRadius: 8,
    padding: '8px 18px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s, color 0.2s',
    '&:hover': {
        backgroundColor: '#228be6',
        color: '#fff',
    },
});

export const ProductGrid = styled(Box)({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 20,

    '@media (max-width: 600px)': {
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
    },
});
