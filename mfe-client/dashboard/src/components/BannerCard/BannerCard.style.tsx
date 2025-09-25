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
	({
		cardSize,
		width,
		height,
		minHeight,
		maxHeight,
		aspectRatio,
		borderRadius,
	}) => ({
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		position: 'relative',
		overflow: 'hidden',
		// Default width - can be overridden
		width: width || '100%',
		// Flexible height system
		height:
			height ||
			(cardSize === 'small' ? 300 : cardSize === 'medium' ? 400 : 600),
		minHeight: minHeight,
		maxHeight: maxHeight,
		// Aspect ratio support
		aspectRatio: aspectRatio,
		// Border radius for rounded corners
		borderRadius: borderRadius || 0,
		// Remove the red background
		backgroundColor: 'transparent',
		// Responsive behavior
		'@media (max-width: 768px)': {
			height:
				height ||
				(cardSize === 'small' ? 200 : cardSize === 'medium' ? 300 : 400),
		},
		'@media (max-width: 480px)': {
			height:
				height ||
				(cardSize === 'small' ? 150 : cardSize === 'medium' ? 250 : 350),
		},
	}),
);

interface ImageProps {
	cardSize: 'small' | 'large' | 'medium';
	objectFit: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
}

export const Image = styled('img')<ImageProps>(({ cardSize, objectFit }) => ({
	width: '100%',
	height: '100%',
	objectFit: objectFit,
	display: 'block',
	// Smooth transitions for better UX
	transition: 'all 0.3s ease',
	// Ensure image doesn't exceed container
	maxWidth: '100%',
	maxHeight: '100%',
}));
