import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { productDetailsAction } from '../../store/actions/product/productDetails.action';

export const useProductDetails = (id: string) => {
    const dispatch = useAppDispatch();
    const { productDetail, loading } = useAppSelector((state) => state.product);

    useEffect(() => {
        dispatch(productDetailsAction({ id }));
    }, [id, dispatch]);

    return { productDetail, loading };
};
