import { useCallback, useMemo, useState } from 'react';

export const useProductFilter = ({ productList }: any) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

	const getStatusClass = (status: string) => {
		switch (status) {
			case 'active':
				return 'badge-success';
			case 'draft':
				return 'badge-warning';
			case 'archived':
				return 'badge-error';
			default:
				return '';
		}
	};

	const getStockClass = (stock: number) => {
		if (stock === 0) return 'stock-out';
		if (stock < 20) return 'stock-low';
		return 'stock-ok';
	};

	const filteredProducts = useMemo(() => {
		if (productList?.length > 0 && !searchTerm?.trim()) return productList;

		return productList?.filter((product: any) =>
			product?.title?.toLowerCase().includes(searchTerm?.toLowerCase()),
		);
	}, [productList, searchTerm]);

	const viewProducts = useMemo(() => {
		return (filteredProducts ?? []).map((p: any) => ({
			...p,
			statusClass: getStatusClass(p.status),
			stockClass: getStockClass(p.quantity),
		}));
	}, [filteredProducts]);

	const toggleSelectAll = useCallback(() => {
		if (selectedProducts.length === filteredProducts.length) {
			setSelectedProducts([]);
		} else {
			setSelectedProducts(filteredProducts.map((p: any) => p.id));
		}
	}, [selectedProducts?.length, filteredProducts?.length]);

	const toggleSelectProduct = useCallback((id: string) => {
		setSelectedProducts((prev) =>
			prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
		);
	}, []);

	return {
		searchTerm,
		selectedProducts,
		filteredProducts,
		viewProducts,
		setSearchTerm,
		toggleSelectAll,
		toggleSelectProduct,
	};
};
