import { useState, useRef } from 'react';
import { productServiceApi } from '../api/baseUrl';
import { convertFileToBase64 } from '../utils/convertFileToBase64';

export interface ProductFormData {
    title: string;
    image: File | null;
    imagePreview: string;
    category: string;
    description: string;
    sellingPrice: number | '';
    originalPrice: number | '';
    quantity: number | '';
    tags: string[];
}

export interface ProductFormErrors {
    title?: string;
    image?: string;
    category?: string;
    description?: string;
    sellingPrice?: string;
    originalPrice?: string;
    quantity?: string;
    tags?: string;
}

const initialFormData: ProductFormData = {
    title: 'test title',
    image: null,
    imagePreview: '',
    category: 'ipad',
    description: 'test description for ipad',
    sellingPrice: 100,
    originalPrice: 100,
    quantity: 10,
    tags: ['ipad', 'apple'],
};

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const CATEGORIES = [
    'ipad',
    'iphone',
    'macbook',
    'watch',
    'airpods',
    'accessories',
];

export const useCreateProduct = (onSuccess?: () => void) => {
    const [formData, setFormData] = useState<ProductFormData>(initialFormData);
    const [errors, setErrors] = useState<ProductFormErrors>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        // Handle numeric fields
        if (['sellingPrice', 'originalPrice', 'quantity'].includes(name)) {
            const numValue = value === '' ? '' : Number(value);
            setFormData(prev => ({ ...prev, [name]: numValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Clear field error
        if (errors[name as keyof ProductFormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
        if (error) setError('');
    };

    // Image upload handlers
    const validateImageFile = (file: File): string | null => {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return 'Please upload a valid image (JPEG, PNG, GIF, or WebP)';
        }
        if (file.size > MAX_FILE_SIZE) {
            return 'Image size must be less than 5MB';
        }
        return null;
    };

    const handleImageSelect = (file: File) => {
        const validationError = validateImageFile(file);
        if (validationError) {
            setErrors(prev => ({ ...prev, image: validationError }));
            return;
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);

        setFormData(prev => ({
            ...prev,
            image: file,
            imagePreview: previewUrl,
        }));
        setErrors(prev => ({ ...prev, image: undefined }));
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleImageSelect(file);
        }
    };

    const handleRemoveImage = () => {
        // Revoke the old preview URL to free memory
        if (formData.imagePreview) {
            URL.revokeObjectURL(formData.imagePreview);
        }
        setFormData(prev => ({
            ...prev,
            image: null,
            imagePreview: '',
        }));
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleAddTag = () => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !formData.tags.includes(tag)) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
            setTagInput('');
            if (errors.tags) {
                setErrors(prev => ({ ...prev, tags: undefined }));
            }
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove),
        }));
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };

    const validateForm = (): boolean => {
        const newErrors: ProductFormErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Product title is required';
        } else if (formData.title.length < 3) {
            newErrors.title = 'Title must be at least 3 characters';
        }

        if (!formData.image) {
            newErrors.image = 'Product image is required';
        }

        if (!formData.category) {
            newErrors.category = 'Please select a category';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Product description is required';
        } else if (formData.description.length < 10) {
            newErrors.description = 'Description must be at least 10 characters';
        }

        if (formData.sellingPrice === '' || formData.sellingPrice <= 0) {
            newErrors.sellingPrice = 'Selling price must be greater than 0';
        }

        if (formData.originalPrice === '' || formData.originalPrice <= 0) {
            newErrors.originalPrice = 'Original price must be greater than 0';
        }

        if (formData.quantity === '' || formData.quantity < 0) {
            newErrors.quantity = 'Quantity must be 0 or greater';
        }

        if (formData.tags.length === 0) {
            newErrors.tags = 'At least one tag is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            // Convert image file to base64
            let imageBase64 = '';
            let contentType = 'image/jpeg';
            if (formData.image) {
                const dataUrl = await convertFileToBase64(formData.image);
                const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
                if (matches) {
                    contentType = matches[1];
                    imageBase64 = matches[2];
                }
            }

            // Send product data with base64 image
            const response = await productServiceApi.post('/new', {
                title: formData.title,
                category: formData.category,
                description: formData.description,
                price: Number(formData.sellingPrice),
                image: imageBase64,
                contentType,
                quantity: Number(formData.quantity),
                tags: formData.tags,
            });
            if (response.status === 201) {
                console.log('response is', response);
                // Reset form on success
                setFormData(initialFormData);
                setTagInput('');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                onSuccess?.();
            }

        } catch (err: any) {
            if (err.response?.data?.errors?.[0]?.message) {
                setError(err.response.data.errors[0].message);
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.message) {
                setError(err.message);
            } else {
                setError('Failed to create product. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        // Cleanup preview URL
        if (formData.imagePreview) {
            URL.revokeObjectURL(formData.imagePreview);
        }
        setFormData(initialFormData);
        setErrors({});
        setError('');
        setTagInput('');
        setIsDragging(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return {
        formData,
        errors,
        loading,
        error,
        tagInput,
        setTagInput,
        isDragging,
        fileInputRef,
        categories: CATEGORIES,
        handleChange,
        handleAddTag,
        handleRemoveTag,
        handleTagInputKeyDown,
        handleFileInputChange,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleRemoveImage,
        triggerFileInput,
        handleSubmit,
        resetForm,
    };
};

