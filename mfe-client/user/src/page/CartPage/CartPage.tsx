import { CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';

import * as Styled from './CartPage.style';
import { useCart } from './CartPage.hook';

const CartPage = () => {
    const {
        items,
        loading,
        error,
        itemCount,
        subtotal,
        shipping,
        tax,
        grandTotal,
        removingId,
        removeItem,
        updateQuantity,
    } = useCart();

    if (loading) {
        return (
            <Styled.PageContainer>
                <Styled.LoadingContainer>
                    <CircularProgress sx={{ color: '#1a1a2e' }} />
                </Styled.LoadingContainer>
            </Styled.PageContainer>
        );
    }

    if (error) {
        return (
            <Styled.PageContainer>
                <Styled.EmptyCartContainer>
                    <Styled.EmptyCartTitle>Something went wrong</Styled.EmptyCartTitle>
                    <Styled.EmptyCartText>{error}</Styled.EmptyCartText>
                    <Styled.ShopNowButton to="/">Return to Home</Styled.ShopNowButton>
                </Styled.EmptyCartContainer>
            </Styled.PageContainer>
        );
    }

    if (items.length === 0) {
        return (
            <Styled.PageContainer>
                <Styled.EmptyCartContainer>
                    <Styled.EmptyCartIcon>
                        <ShoppingBagOutlinedIcon sx={{ fontSize: 80, color: '#dee2e6' }} />
                    </Styled.EmptyCartIcon>
                    <Styled.EmptyCartTitle>Your cart is empty</Styled.EmptyCartTitle>
                    <Styled.EmptyCartText>
                        Looks like you haven't added anything to your cart yet.
                    </Styled.EmptyCartText>
                    <Styled.ShopNowButton to="/">Start Shopping</Styled.ShopNowButton>
                </Styled.EmptyCartContainer>
            </Styled.PageContainer>
        );
    }

    return (
        <Styled.PageContainer>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <Styled.PageTitle>Shopping Cart</Styled.PageTitle>
                <Styled.ItemCount>
                    {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
                </Styled.ItemCount>

                <Styled.ContentWrapper>
                    {/* Cart Items */}
                    <Styled.CartSection>
                        {items.map((item) => (
                            <Styled.CartItem key={item.cart_id}>
                                <Styled.ProductImage
                                    src={item.image}
                                    alt={item.title}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                            'https://via.placeholder.com/120?text=No+Image';
                                    }}
                                />
                                <Styled.ProductDetails>
                                    <div>
                                        <Styled.ProductTitle>{item.title}</Styled.ProductTitle>
                                        <Styled.ProductPrice>
                                            ${item.price.toFixed(2)}
                                        </Styled.ProductPrice>
                                        <Styled.ProductSubtotal>
                                            Subtotal: ${item.total.toFixed(2)}
                                        </Styled.ProductSubtotal>
                                    </div>
                                    <Styled.QuantityWrapper>
                                        <Styled.QuantityControl>
                                            <Styled.QuantityButton
                                                onClick={() =>
                                                    updateQuantity(item.cart_id, item.quantity - 1)
                                                }
                                                disabled={item.quantity <= 1}
                                            >
                                                <RemoveIcon fontSize="small" />
                                            </Styled.QuantityButton>
                                            <Styled.QuantityValue>
                                                {item.quantity}
                                            </Styled.QuantityValue>
                                            <Styled.QuantityButton
                                                onClick={() =>
                                                    updateQuantity(item.cart_id, item.quantity + 1)
                                                }
                                            >
                                                <AddIcon fontSize="small" />
                                            </Styled.QuantityButton>
                                        </Styled.QuantityControl>
                                        <Styled.RemoveButton
                                            onClick={() => removeItem(item.cart_id)}
                                            disabled={removingId === item.cart_id}
                                        >
                                            {removingId === item.cart_id ? (
                                                <CircularProgress size={18} color="inherit" />
                                            ) : (
                                                <DeleteOutlineIcon fontSize="small" />
                                            )}
                                        </Styled.RemoveButton>
                                    </Styled.QuantityWrapper>
                                </Styled.ProductDetails>
                            </Styled.CartItem>
                        ))}
                    </Styled.CartSection>

                    {/* Order Summary */}
                    <Styled.SummarySection>
                        <Styled.SummaryTitle>Order Summary</Styled.SummaryTitle>

                        <Styled.SummaryRow>
                            <Styled.SummaryLabel>Subtotal</Styled.SummaryLabel>
                            <Styled.SummaryValue>${subtotal.toFixed(2)}</Styled.SummaryValue>
                        </Styled.SummaryRow>

                        <Styled.SummaryRow>
                            <Styled.SummaryLabel>Shipping</Styled.SummaryLabel>
                            <Styled.SummaryValue>
                                {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                            </Styled.SummaryValue>
                        </Styled.SummaryRow>

                        <Styled.SummaryRow>
                            <Styled.SummaryLabel>Estimated Tax</Styled.SummaryLabel>
                            <Styled.SummaryValue>${tax.toFixed(2)}</Styled.SummaryValue>
                        </Styled.SummaryRow>

                        <Styled.SummaryRow isTotal>
                            <Styled.SummaryLabel isTotal>Total</Styled.SummaryLabel>
                            <Styled.SummaryValue isTotal>
                                ${grandTotal.toFixed(2)}
                            </Styled.SummaryValue>
                        </Styled.SummaryRow>

                        <Styled.PromoCodeWrapper>
                            <Styled.PromoInput placeholder="Promo code" />
                            <Styled.ApplyButton>Apply</Styled.ApplyButton>
                        </Styled.PromoCodeWrapper>

                        <Styled.CheckoutButton disabled={items.length === 0}>
                            Proceed to Checkout
                        </Styled.CheckoutButton>

                        <Styled.SecureCheckout>
                            <LockOutlinedIcon sx={{ fontSize: 14 }} />
                            Secure checkout powered by Stripe
                        </Styled.SecureCheckout>
                    </Styled.SummarySection>
                </Styled.ContentWrapper>
            </div>
        </Styled.PageContainer>
    );
};

export default CartPage;

