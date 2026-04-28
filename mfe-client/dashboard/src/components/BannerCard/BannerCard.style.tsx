import { styled } from '@mui/material';

interface ContainerProps {
    cardSize: 'small' | 'large' | 'medium';
    width?: string | number;
    height?: string | number;
    minHeight?: string | number;
    maxHeight?: string | number;
    aspectRatio?: string;
    borderRadius?: string | number;
}

export const Container = styled('div')<ContainerProps>(
    ({ cardSize, width, height, minHeight, maxHeight, aspectRatio, borderRadius }) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        width: width || '100%',
        height:
            height || (cardSize === 'small' ? 300 : cardSize === 'medium' ? 400 : 600),
        minHeight,
        maxHeight,
        aspectRatio,
        borderRadius: borderRadius || 0,
        backgroundColor: '#1a1a2e',
        '@media (max-width: 768px)': {
            height:
                height || (cardSize === 'small' ? 200 : cardSize === 'medium' ? 300 : 400),
        },
        '@media (max-width: 480px)': {
            height:
                height || (cardSize === 'small' ? 150 : cardSize === 'medium' ? 250 : 350),
        },
    }),
);

interface ImageProps {
    cardSize: 'small' | 'large' | 'medium';
    objectFit: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
}

export const Image = styled('img')<ImageProps>(({ objectFit }) => ({
    width: '100%',
    height: '100%',
    objectFit,
    display: 'block',
    transition: 'transform 0.6s ease',
    maxWidth: '100%',
    maxHeight: '100%',
}));

export const Overlay = styled('div')({
    position: 'absolute',
    inset: 0,
    background:
        'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.05) 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '0 8%',
});

export const OverlayEyebrow = styled('span')({
    display: 'inline-block',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: '#74c0fc',
    marginBottom: 12,
});

export const OverlayHeadline = styled('h2')({
    margin: 0,
    fontSize: 'clamp(24px, 4vw, 52px)',
    fontWeight: 800,
    color: '#fff',
    lineHeight: 1.15,
    maxWidth: 520,
});

export const OverlaySubline = styled('p')({
    margin: '12px 0 0',
    fontSize: 'clamp(13px, 1.5vw, 18px)',
    color: 'rgba(255,255,255,0.8)',
    maxWidth: 400,
    lineHeight: 1.6,
});

export const OverlayCta = styled('button')({
    marginTop: 28,
    padding: '13px 32px',
    backgroundColor: '#228be6',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    width: 'fit-content',
    transition: 'background 0.2s, transform 0.15s',
    '&:hover': {
        backgroundColor: '#1c7ed6',
        transform: 'translateY(-2px)',
    },
});

export const MiniBannerOverlay = styled('div')({
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: '20px 16px',
});

export const MiniBannerLabel = styled('span')({
    fontSize: 14,
    fontWeight: 700,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '1px',
});
