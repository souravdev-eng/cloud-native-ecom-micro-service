import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productApi, productSearchApi } from '../../api/baseUrl';
import { isUnauthorized, parseErrorMessage } from '../../utils/parseError';

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
    highlight?: {
        title?: string[];
        description?: string[];
    };
    score?: number;
}

export interface PaginationMeta {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    count: number;
    limit: number;
    nextKey: string | null;
    page?: number;
    total?: number;
}

export interface SearchFilters {
    priceMin?: number;
    priceMax?: number;
    minRating?: number;
    sortByPrice?: 'asc' | 'desc';
    parsedSearchText?: string;
}

export interface Filters {
    categories: string[];      // multi-select  →  ?category=phone,earphone
    minPrice: number | '';
    maxPrice: number | '';
    minRating: number;        // threshold     →  ?rating=4
    search: string;
    sortBy: string;
    inStock: boolean;
}

export const CATEGORIES = ['phone', 'earphone', 'book', 'fashions', 'other'] as const;
const PAGE_LIMIT = 12;

const BLANK: Filters = {
    categories: [], minPrice: '', maxPrice: '', minRating: 0,
    search: '', sortBy: '-_id', inStock: false,
};

// ── URL ↔ Filters ────────────────────────────────────────────────────────────

const fromParams = (p: URLSearchParams): Filters => ({
    categories: p.get('category')?.split(',').filter(Boolean) ?? [],
    minPrice: p.get('minPrice') ? Number(p.get('minPrice')) : '',
    maxPrice: p.get('maxPrice') ? Number(p.get('maxPrice')) : '',
    minRating: Number(p.get('rating') ?? 0),
    search: p.get('search') ?? '',
    sortBy: p.get('sortBy') ?? '-_id',
    inStock: p.get('inStock') === 'true',
});

const toUrlRecord = (f: Filters): Record<string, string> => {
    const p: Record<string, string> = {};
    if (f.categories.length) p.category = f.categories.join(',');
    if (f.minPrice !== '') p.minPrice = String(f.minPrice);
    if (f.maxPrice !== '') p.maxPrice = String(f.maxPrice);
    if (f.minRating > 0) p.rating = String(f.minRating);
    if (f.search) p.search = f.search;
    if (f.sortBy !== '-_id') p.sortBy = f.sortBy;
    if (f.inStock) p.inStock = 'true';
    return p;
};

// ── API query builder ────────────────────────────────────────────────────────

const buildQuery = (f: Filters, cursor: string | null): URLSearchParams => {
    const p = new URLSearchParams();
    p.append('limit', String(PAGE_LIMIT));
    p.append('fields', 'title,image,price,tags,rating,category,quantity');

    if (cursor) p.append('nextKey', cursor);
    // Comma-separated → backend converts to $in
    if (f.categories.length) p.append('category', f.categories.join(','));
    if (f.minPrice !== '') p.append('price[gte]', String(f.minPrice));
    if (f.maxPrice !== '') p.append('price[lte]', String(f.maxPrice));
    if (f.minRating > 0) p.append('rating[gte]', String(f.minRating));
    if (f.search) p.append('search', f.search);
    if (f.sortBy) p.append('sort', f.sortBy);
    if (f.inStock) p.append('quantity[gt]', '0');
    return p;
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useProductsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const isFirstRender = useRef(true);

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [meta, setMeta] = useState<PaginationMeta>({
        hasNextPage: false, hasPrevPage: false, count: 0, limit: PAGE_LIMIT, nextKey: null,
    });
    const [filters, setFilters] = useState<Filters>(() => fromParams(searchParams));
    const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [searchSource, setSearchSource] = useState<'listing' | 'elasticsearch' | 'mongodb'>('listing');
    const [parsedFilters, setParsedFilters] = useState<SearchFilters | null>(null);
    // A failed fetch used to only reach console.error, leaving the grid empty
    // and indistinguishable from "no products match these filters".
    const [error, setError] = useState<string | null>(null);
    const [requiresAuth, setRequiresAuth] = useState(false);

    // ── Fetch (ES search) ────────────────────────────────────────────────────

    const fetchWithSearch = useCallback(async (f: Filters, page: number = 1) => {
        setIsLoading(true);
        setError(null);
        setRequiresAuth(false);
        try {
            const params = new URLSearchParams();
            params.append('q', f.search);
            params.append('limit', String(PAGE_LIMIT));
            params.append('page', String(page));
            if (f.categories.length) params.append('category', f.categories[0]);

            const res = await productSearchApi.get(`?${params.toString()}`);
            if (res.status === 200) {
                const data = res.data.data ?? [];
                // Map ES response to Product interface
                const mapped: Product[] = data.map((item: any) => ({
                    id: item.id || item.productId || item._id,
                    title: item.title,
                    price: item.price,
                    image: item.image || '',
                    category: item.category || '',
                    tags: item.tags || [],
                    rating: item.rating || 0,
                    quantity: item.quantity ?? 1,
                    description: item.description,
                    highlight: item.highlight,
                    score: item.score,
                }));

                setProducts(mapped);
                const m = res.data.meta ?? {};
                setMeta({
                    hasNextPage: m.hasNextPage ?? false,
                    hasPrevPage: (m.page ?? 1) > 1,
                    count: mapped.length,
                    limit: m.limit ?? PAGE_LIMIT,
                    nextKey: null,
                    page: m.page ?? 1,
                    total: m.total ?? 0,
                });
                setSearchSource(res.data.source === 'elasticsearch' ? 'elasticsearch' : 'mongodb');
                setParsedFilters(res.data.filters ?? null);
            }
        } catch (err) {
            setRequiresAuth(isUnauthorized(err));
            setError(parseErrorMessage(err, 'Product search failed'));
            setProducts([]);
            setSearchSource('listing');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ── Fetch (regular listing) ──────────────────────────────────────────────

    const fetchWithFilters = useCallback(async (f: Filters, cursor: string | null = null) => {
        // If search is active, delegate to ES search API
        if (f.search.trim()) {
            await fetchWithSearch(f, 1);
            return;
        }

        setSearchSource('listing');
        setParsedFilters(null);
        setIsLoading(true);
        setError(null);
        setRequiresAuth(false);
        try {
            const res = await productApi.get(`/?${buildQuery(f, cursor).toString()}`);
            if (res.status === 200) {
                setProducts(res.data.data ?? []);
                const m = res.data.meta ?? {};
                setMeta({
                    hasNextPage: m.hasNextPage ?? false,
                    hasPrevPage: m.hasPrevPage ?? false,
                    count: m.count ?? 0,
                    limit: m.limit ?? PAGE_LIMIT,
                    nextKey: m.nextKey ?? null,
                });
            }
        } catch (err) {
            setRequiresAuth(isUnauthorized(err));
            setError(parseErrorMessage(err, 'Could not load products'));
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    }, [fetchWithSearch]);

    // ── Pagination ────────────────────────────────────────────────────────────

    const handleNextPage = useCallback(() => {
        if (!meta.hasNextPage) return;

        // Search mode: page-based
        if (filters.search.trim()) {
            const nextPage = (meta.page ?? 1) + 1;
            setCurrentPageIndex(nextPage - 1);
            fetchWithSearch(filters, nextPage);
            return;
        }

        // Listing mode: cursor-based
        if (!meta.nextKey) return;
        const newIndex = currentPageIndex + 1;
        if (newIndex >= cursorHistory.length) setCursorHistory(p => [...p, meta.nextKey]);
        setCurrentPageIndex(newIndex);
        fetchWithFilters(filters, meta.nextKey);
    }, [meta, currentPageIndex, cursorHistory.length, filters, fetchWithFilters, fetchWithSearch]);

    const handlePrevPage = useCallback(() => {
        if (currentPageIndex <= 0) return;

        // Search mode: page-based
        if (filters.search.trim()) {
            const prevPage = (meta.page ?? 1) - 1;
            if (prevPage < 1) return;
            setCurrentPageIndex(prevPage - 1);
            fetchWithSearch(filters, prevPage);
            return;
        }

        // Listing mode: cursor-based
        const newIndex = currentPageIndex - 1;
        setCurrentPageIndex(newIndex);
        fetchWithFilters(filters, cursorHistory[newIndex]);
    }, [currentPageIndex, cursorHistory, filters, meta.page, fetchWithFilters, fetchWithSearch]);

    const handleFirstPage = useCallback(() => {
        setCurrentPageIndex(0);
        setCursorHistory([null]);
        if (filters.search.trim()) {
            fetchWithSearch(filters, 1);
        } else {
            fetchWithFilters(filters, null);
        }
    }, [filters, fetchWithFilters, fetchWithSearch]);

    // ── Filter mutations ──────────────────────────────────────────────────────

    const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    /** Toggle a single category in the multi-select list and fetch immediately. */
    const toggleCategory = useCallback((cat: string) => {
        setFilters(prev => {
            const already = prev.categories.includes(cat);
            const next: Filters = {
                ...prev,
                categories: already
                    ? prev.categories.filter(c => c !== cat)
                    : [...prev.categories, cat],
            };
            setCurrentPageIndex(0);
            setCursorHistory([null]);
            setSearchParams(toUrlRecord(next), { replace: true });
            fetchWithFilters(next, null);
            return next;
        });
    }, [fetchWithFilters, setSearchParams]);

    /** Apply a partial patch and fetch immediately — used by price Go, rating, inStock. */
    const applyImmediate = useCallback((patch: Partial<Filters>) => {
        setFilters(prev => {
            const next = { ...prev, ...patch };
            setCurrentPageIndex(0);
            setCursorHistory([null]);
            setSearchParams(toUrlRecord(next), { replace: true });
            fetchWithFilters(next, null);
            return next;
        });
    }, [fetchWithFilters, setSearchParams]);

    /** Explicit apply — used by price inputs on Enter and the search bar. */
    const applyFilters = useCallback(() => {
        setFilters(prev => {
            setCurrentPageIndex(0);
            setCursorHistory([null]);
            setSearchParams(toUrlRecord(prev), { replace: true });
            fetchWithFilters(prev, null);
            return prev;
        });
    }, [fetchWithFilters, setSearchParams]);

    const resetFilters = useCallback(() => {
        setFilters(BLANK);
        setCurrentPageIndex(0);
        setCursorHistory([null]);
        setSearchParams({}, { replace: true });
        fetchWithFilters(BLANK, null);
    }, [fetchWithFilters, setSearchParams]);

    const removeFilter = useCallback((key: keyof Filters) => {
        applyImmediate({ [key]: BLANK[key] } as Partial<Filters>);
    }, [applyImmediate]);

    // ── Active filter chips ───────────────────────────────────────────────────

    const activeFilters = (() => {
        const chips: { key: keyof Filters; label: string }[] = [];
        // One chip per selected category
        filters.categories.forEach(cat =>
            chips.push({ key: 'categories', label: cat }),
        );
        if (filters.minPrice !== '') chips.push({ key: 'minPrice', label: `From $${filters.minPrice}` });
        if (filters.maxPrice !== '') chips.push({ key: 'maxPrice', label: `Up to $${filters.maxPrice}` });
        if (filters.minRating > 0) chips.push({ key: 'minRating', label: `${filters.minRating}★ & up` });
        if (filters.search) chips.push({ key: 'search', label: `"${filters.search}"` });
        if (filters.inStock) chips.push({ key: 'inStock', label: 'In Stock' });
        return chips;
    })();

    // ── Initial fetch ─────────────────────────────────────────────────────────

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            fetchWithFilters(filters, null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        products, isLoading, meta, filters, error, requiresAuth,
        retry: () => fetchWithFilters(filters, null),
        categories: CATEGORIES,
        currentPage: filters.search.trim() ? (meta.page ?? 1) : currentPageIndex + 1,
        hasNextPage: meta.hasNextPage,
        hasPrevPage: filters.search.trim() ? (meta.page ?? 1) > 1 : currentPageIndex > 0,
        activeFilters,
        searchSource,
        parsedFilters,
        handleNextPage, handlePrevPage, handleFirstPage,
        updateFilter, toggleCategory, applyFilters, applyImmediate, resetFilters, removeFilter,
    };
};
