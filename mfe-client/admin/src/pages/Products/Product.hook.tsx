import { useState, useEffect } from 'react'
import { productServiceApi } from '../../api/baseUrl';

export const useProduct = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [productList, setProductList] = useState<any>([]);
    const [totalProducts, setTotalProducts] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [page, setPage] = useState<number>(1);


    const fetchProductList = async ({ page = 1 }: { page?: number }) => {
        setIsLoading(true);
        try {
            const response = await productServiceApi.get(`/seller?limit=20&page=${page}`);
            if (response.status === 200) {
                setProductList(response.data.data)
                setTotalProducts(response.data.meta.count)
            }
        } catch (error) {
            console.log('error in fetchProductList', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handlePageChange = (page: number) => {
        setPage(page);
        fetchProductList({ page });
    }


    useEffect(() => {
        fetchProductList({ page });
    }, [page]);

    return {
        currentPage,
        setCurrentPage,
        productList, isLoading, totalProducts, handlePageChange
    };
}