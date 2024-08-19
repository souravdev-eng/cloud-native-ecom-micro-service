import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { productDetailsAction } from '../../store/actions/product/productDetails.action';
import { addToCartAction } from '../../store/actions/cart/addToCart.action';

export const useProductDetails = (id: string) => {
    const dispatch = useAppDispatch();
    const [cartQty, setCartQty] = useState(1);
    const { productDetail, loading } = useAppSelector((state) => state.product);

    useEffect(() => {
        dispatch(productDetailsAction({ id }));
    }, [id, dispatch]);

    const addCartQty = () => {
        setCartQty(cartQty + 1);
    };

    const removeCartQty = () => {
        if (cartQty > 1) {
            setCartQty(cartQty - 1);
        }
    };

    const handleAddToCart = () => {
        console.log(cartQty, id);
        dispatch(addToCartAction({ productId: id, quantity: cartQty }));
    };

    return {
        cartQty,
        productDetail,
        loading,
        addCartQty,
        removeCartQty,
        handleAddToCart,
    };
};
