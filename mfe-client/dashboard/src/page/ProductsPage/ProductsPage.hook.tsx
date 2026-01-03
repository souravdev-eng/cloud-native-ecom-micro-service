import { useState, useEffect, useCallback } from 'react';
import { productApi } from '../../api/baseUrl';

export interface Product {
    id: string;
    title: string;
    price: number;
    image: string;
    category: string;
    tags: string[];
    rating: number;
    quantity: number;
    description?: string;
}

export interface PaginationMeta {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    count: number;
    limit: number;
    nextKey: string | null;
}

export interface Filters {
    category: string;
    minPrice: number | '';
    maxPrice: number | '';
    minRating: number;
    search: string;
    sortBy: string;
}

const CATEGORIES = ['phone', 'earphone', 'book', 'fashions', 'other'] as const;

export const useProductsPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [meta, setMeta] = useState<PaginationMeta>({
        hasNextPage: false,
        hasPrevPage: false,
        count: 0,
        limit: 12,
        nextKey: null,
    });

    const [filters, setFilters] = useState<Filters>({
        category: '',
        minPrice: '',
        maxPrice: '',
        minRating: 0,
        search: '',
        sortBy: '-_id',
    });

    // Cursor history for previous navigation
    const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
    const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

    const buildQueryParams = useCallback((cursor: string | null = null): URLSearchParams => {
        const params = new URLSearchParams();
        params.append('limit', '12');
        params.append('fields', 'title,image,price,tags,rating,category,quantity');

        if (cursor) {
            params.append('nextKey', cursor);
        }

        if (filters.category) {
            params.append('category', filters.category);
        }

        if (filters.minPrice !== '') {
            params.append('price[gte]', String(filters.minPrice));
        }

        if (filters.maxPrice !== '') {
            params.append('price[lte]', String(filters.maxPrice));
        }

        if (filters.search) {
            params.append('search', filters.search);
        }

        if (filters.sortBy) {
            params.append('sort', filters.sortBy);
        }

        return params;
    }, [filters]);

    const fetchProducts = useCallback(async (cursor: string | null = null) => {
        setIsLoading(true);
        try {
            const params = buildQueryParams(cursor);
            const response = await productApi.get(`/?${params.toString()}`);

            if (response.status === 200) {
                let data = response.data.data || [];

                // Client-side rating filter (if API doesn't support it)
                if (filters.minRating > 0) {
                    data = data.filter((p: Product) => p.rating >= filters.minRating);
                }

                setProducts(data);
                setMeta({
                    hasNextPage: response.data.meta?.hasNextPage || false,
                    hasPrevPage: response.data.meta?.hasPrevPage || false,
                    count: response.data.meta?.count || data.length,
                    limit: response.data.meta?.limit || 12,
                    nextKey: response.data.meta?.nextKey || null,
                });
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    }, [buildQueryParams, filters.minRating]);

    const handleNextPage = useCallback(() => {
        if (meta.hasNextPage && meta.nextKey) {
            const newPageIndex = currentPageIndex + 1;

            if (newPageIndex >= cursorHistory.length) {
                setCursorHistory(prev => [...prev, meta.nextKey]);
            }

            setCurrentPageIndex(newPageIndex);
            fetchProducts(meta.nextKey);
        }
    }, [meta.hasNextPage, meta.nextKey, currentPageIndex, cursorHistory.length, fetchProducts]);

    const handlePrevPage = useCallback(() => {
        if (currentPageIndex > 0) {
            const newPageIndex = currentPageIndex - 1;
            setCurrentPageIndex(newPageIndex);
            fetchProducts(cursorHistory[newPageIndex]);
        }
    }, [currentPageIndex, cursorHistory, fetchProducts]);

    const handleFirstPage = useCallback(() => {
        setCurrentPageIndex(0);
        setCursorHistory([null]);
        fetchProducts(null);
    }, [fetchProducts]);

    const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters({
            category: '',
            minPrice: '',
            maxPrice: '',
            minRating: 0,
            search: '',
            sortBy: '-_id',
        });
    }, []);

    const applyFilters = useCallback(() => {
        setCurrentPageIndex(0);
        setCursorHistory([null]);
        fetchProducts(null);
    }, [fetchProducts]);

    // Initial fetch
    useEffect(() => {
        fetchProducts(null);
    }, []);

    return {
        products,
        isLoading,
        meta,
        filters,
        categories: CATEGORIES,
        currentPage: currentPageIndex + 1,
        hasNextPage: meta.hasNextPage,
        hasPrevPage: currentPageIndex > 0,
        handleNextPage,
        handlePrevPage,
        handleFirstPage,
        updateFilter,
        resetFilters,
        applyFilters,
    };
};

