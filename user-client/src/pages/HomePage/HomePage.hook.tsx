import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { productListAction } from '../../store/actions/product/productList.action';
import { listCartItemsAction } from '../../store/actions/cart/listCartItems.action';

export const useHomePage = () => {
    const dispatch = useAppDispatch();
    const { productList } = useAppSelector((state) => state.product);

    useEffect(() => {
        dispatch(productListAction());
        dispatch(listCartItemsAction());
    }, [dispatch]);

    return { productList };
};
