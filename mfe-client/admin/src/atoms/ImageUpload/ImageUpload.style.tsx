import { styled, Theme, useTheme } from '@mui/material/styles';

export const ImageUploadContainer = styled('div')(({ isDragging, errors }: { isDragging: boolean, errors: { image: string } }) => {
    const theme = useTheme();
    return ({
        width: '100%',
        minHeight: 180,
        border: `2px dashed ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
        background: theme.palette.background.paper,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        cursor: 'pointer',
        transition: theme.transitions.create('all', {
            duration: theme.transitions.duration.short,
        }),
        padding: 24,
        ...(isDragging && {
            borderColor: theme.palette.primary.main,
            background: theme.palette.primary.light,
        }),
        ...(errors.image && {
            borderColor: theme.palette.error.main,
        }),
    })
});