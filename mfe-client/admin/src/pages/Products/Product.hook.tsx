import { useState, useEffect, useCallback } from 'react';
import { productServiceApi } from '../../api/baseUrl';

interface PaginationMeta {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    count: number;
    limit: number;
    nextKey: string | null;
}

export const useProduct = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [productList, setProductList] = useState<any[]>([]);
    const [meta, setMeta] = useState<PaginationMeta>({
        hasNextPage: false,
        hasPrevPage: false,
        count: 0,
        limit: 20,
        nextKey: null,
    });

    // Store cursor history for "Previous" navigation
    const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
    const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

    const fetchProductList = useCallback(async (cursor: string | null = null) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ limit: '20' });
            if (cursor) {
                params.append('nextKey', cursor);
            }

            const response = await productServiceApi.get(`/seller?${params.toString()}`);
            if (response.status === 200) {
                setProductList(response.data.data);
                setMeta({
                    hasNextPage: response.data.meta.hasNextPage,
                    hasPrevPage: response.data.meta.hasPrevPage,
                    count: response.data.meta.count,
                    limit: response.data.meta.limit,
                    nextKey: response.data.meta.nextKey || null,
                });
            }
        } catch (error) {
            console.log('error in fetchProductList', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleNextPage = useCallback(() => {
        if (meta.hasNextPage && meta.nextKey) {
            const newPageIndex = currentPageIndex + 1;

            // Add the nextKey to history if we're moving forward to a new page
            if (newPageIndex >= cursorHistory.length) {
                setCursorHistory(prev => [...prev, meta.nextKey]);
            }

            setCurrentPageIndex(newPageIndex);
            fetchProductList(meta.nextKey);
        }
    }, [meta.hasNextPage, meta.nextKey, currentPageIndex, cursorHistory.length, fetchProductList]);

    const handlePrevPage = useCallback(() => {
        if (currentPageIndex > 0) {
            const newPageIndex = currentPageIndex - 1;
            setCurrentPageIndex(newPageIndex);
            fetchProductList(cursorHistory[newPageIndex]);
        }
    }, [currentPageIndex, cursorHistory, fetchProductList]);

    const handleFirstPage = useCallback(() => {
        setCurrentPageIndex(0);
        setCursorHistory([null]);
        fetchProductList(null);
    }, [fetchProductList]);

    const refreshProducts = useCallback(() => {
        fetchProductList(cursorHistory[currentPageIndex]);
    }, [fetchProductList, cursorHistory, currentPageIndex]);

    useEffect(() => {
        fetchProductList(null);
    }, []);

    return {
        productList,
        isLoading,
        meta,
        currentPage: currentPageIndex + 1,
        hasNextPage: meta.hasNextPage,
        hasPrevPage: currentPageIndex > 0,
        handleNextPage,
        handlePrevPage,
        handleFirstPage,
        refreshProducts,
    };
};