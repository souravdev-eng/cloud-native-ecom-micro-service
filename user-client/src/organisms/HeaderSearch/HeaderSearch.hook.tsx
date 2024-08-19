import { useAppSelector } from '../../hooks/useRedux';

export const useHeaderSearch = () => {
    const { cartList } = useAppSelector((state) => state.cart);

    return { cartList };
};
