import React from 'react';

import * as Styled from './BannerCard.style.tsx';
import Banner1 from '../../assets/Banner_1.jpg';

interface BannerCardProps {
    cardSize?: 'small' | 'large' | 'medium';
    objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
    width?: string | number;
    height?: string | number;
    minHeight?: string | number;
    maxHeight?: string | number;
    aspectRatio?: string;
    borderRadius?: string | number;
    className?: string;
    style?: React.CSSProperties;
    // Hero overlay
    eyebrow?: string;
    headline?: string;
    subline?: string;
    ctaText?: string;
    onCtaClick?: () => void;
    // Mini label overlay
    miniLabel?: string;
}

const BannerCard = React.memo(
    ({
        cardSize = 'large',
        objectFit = 'cover',
        width,
        height,
        minHeight,
        maxHeight,
        aspectRatio,
        borderRadius,
        className,
        style,
        eyebrow,
        headline,
        subline,
        ctaText,
        onCtaClick,
        miniLabel,
    }: BannerCardProps) => {
        return (
            <Styled.Container
                cardSize={cardSize}
                width={width}
                height={height}
                minHeight={minHeight}
                maxHeight={maxHeight}
                aspectRatio={aspectRatio}
                borderRadius={borderRadius}
                className={className}
                style={style}
            >
                <Styled.Image
                    src={Banner1}
                    alt="Banner"
                    cardSize={cardSize}
                    objectFit={objectFit}
                />

                {headline && (
                    <Styled.Overlay>
                        {eyebrow && <Styled.OverlayEyebrow>{eyebrow}</Styled.OverlayEyebrow>}
                        <Styled.OverlayHeadline>{headline}</Styled.OverlayHeadline>
                        {subline && <Styled.OverlaySubline>{subline}</Styled.OverlaySubline>}
                        {ctaText && (
                            <Styled.OverlayCta onClick={onCtaClick}>
                                {ctaText} →
                            </Styled.OverlayCta>
                        )}
                    </Styled.Overlay>
                )}

                {miniLabel && !headline && (
                    <Styled.MiniBannerOverlay>
                        <Styled.MiniBannerLabel>{miniLabel}</Styled.MiniBannerLabel>
                    </Styled.MiniBannerOverlay>
                )}
            </Styled.Container>
        );
    },
);

export default BannerCard;
