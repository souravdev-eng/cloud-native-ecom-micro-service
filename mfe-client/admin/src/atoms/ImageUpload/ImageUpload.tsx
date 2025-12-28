import React from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUploadRounded';
import { ImageUploadContainer } from './ImageUpload.style';
import { Typography } from '@mui/material';

interface ImageUploadProps {
    // image: string;
    isDragging: boolean;
    errors: any;
    triggerFileInput: () => void;
    handleDragOver: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
}

const ImageUpload = ({ isDragging, errors, triggerFileInput, handleDragOver, handleDragLeave, handleDrop }: ImageUploadProps) => {
    return (

        <ImageUploadContainer
            isDragging={isDragging}
            errors={errors}
            onClick={triggerFileInput}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <CloudUploadIcon sx={{ width: 48, height: 48, color: 'text.muted', opacity: 0.6 }} />
            <Typography variant="body1" className="upload-text">
                <Typography variant="body1" color="primary.main">Click to upload</Typography> or drag and drop
            </Typography>
            <Typography variant="body2" className="upload-hint" color="text.secondary">PNG, JPG, GIF or WebP (max 5MB)</Typography>
        </ImageUploadContainer>
    );
};

export default ImageUpload;
