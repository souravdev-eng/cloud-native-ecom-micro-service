import { styled, Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export const FooterWrapper = styled(Box)({
    backgroundColor: '#1a1a2e',
    color: '#adb5bd',
});

export const TopBar = styled(Box)({
    backgroundColor: '#16213e',
    padding: '12px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',

    '@media (max-width: 768px)': { padding: '12px 16px' },
});

export const TopBarText = styled(Typography)({
    fontSize: 13,
    color: '#adb5bd',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
});

export const TopBarCta = styled('button')({
    fontSize: 12,
    fontWeight: 700,
    color: '#74c0fc',
    background: 'none',
    border: '1px solid #74c0fc',
    borderRadius: 6,
    padding: '6px 16px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s, color 0.2s',
    '&:hover': { backgroundColor: '#74c0fc', color: '#1a1a2e' },
});

export const MainGrid = styled(Box)({
    display: 'grid',
    gridTemplateColumns: '1.8fr 1fr 1fr 1fr',
    gap: 40,
    padding: '52px 40px 40px',
    maxWidth: 1280,
    margin: '0 auto',

    '@media (max-width: 1024px)': { gridTemplateColumns: '1fr 1fr' },
    '@media (max-width: 600px)': { gridTemplateColumns: '1fr', padding: '32px 16px 24px' },
});

export const BrandCol = styled(Box)({});

export const BrandName = styled(Typography)({
    fontSize: 22,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-0.5px',
    marginBottom: 10,

    '& span': { color: '#228be6' },
});

export const BrandTagline = styled(Typography)({
    fontSize: 13,
    color: '#868e96',
    lineHeight: 1.7,
    maxWidth: 260,
    marginBottom: 24,
});

export const SocialRow = styled(Box)({
    display: 'flex',
    gap: 10,
});

export const SocialBtn = styled('a')({
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#16213e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#adb5bd',
    cursor: 'pointer',
    transition: 'background 0.18s, color 0.18s',
    textDecoration: 'none',
    '&:hover': { backgroundColor: '#228be6', color: '#fff' },
});

export const ColTitle = styled(Typography)({
    fontSize: 12,
    fontWeight: 700,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '1.2px',
    marginBottom: 18,
});

export const ColList = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
});

export const ColLink = styled(Link)({
    fontSize: 13,
    color: '#868e96',
    textDecoration: 'none',
    transition: 'color 0.15s',
    '&:hover': { color: '#fff' },
});

export const ColText = styled(Typography)({
    fontSize: 13,
    color: '#868e96',
    lineHeight: 1.6,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
});

export const Divider = styled(Box)({
    height: 1,
    backgroundColor: '#16213e',
    margin: '0 40px',

    '@media (max-width: 600px)': { margin: '0 16px' },
});

export const BottomBar = styled(Box)({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    maxWidth: 1280,
    margin: '0 auto',
    flexWrap: 'wrap',
    gap: 12,

    '@media (max-width: 600px)': { padding: '16px', flexDirection: 'column', textAlign: 'center' },
});

export const Copyright = styled(Typography)({
    fontSize: 12,
    color: '#495057',
});

export const PaymentIcons = styled(Box)({
    display: 'flex',
    gap: 8,
    alignItems: 'center',
});

export const PaymentBadge = styled(Box)({
    padding: '4px 10px',
    borderRadius: 4,
    backgroundColor: '#16213e',
    fontSize: 11,
    fontWeight: 700,
    color: '#868e96',
    letterSpacing: '0.5px',
});
