import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement } from '@stripe/react-stripe-js';
import { CircularProgress, MenuItem, FormControl, InputLabel } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useNavigate } from 'react-router-dom';

import * as Styled from './CheckoutPage.style';
import { useCheckout } from './CheckoutPage.hook';

// Get your PUBLISHABLE key from: https://dashboard.stripe.com/apikeys
// It starts with pk_test_ (test mode) or pk_live_ (production)
const stripePromise = loadStripe('pk_test_51JOBJnSA4EPPqs66VxVusJrEerUnYWuDGHkzasE78kNncq9UgLx4PwQdU8XPpn41qwz1vhNsxcY14rSQ7fC0c0gt00lNQYG9wa');

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '16px',
            color: '#1a1a2e',
            fontFamily: '"Inter", sans-serif',
            '::placeholder': {
                color: '#adb5bd',
            },
        },
        invalid: {
            color: '#c92a2a',
            iconColor: '#c92a2a',
        },
    },
};

const steps = ['Shipping', 'Payment', 'Confirmation'];

const CheckoutForm = () => {
    const navigate = useNavigate();
    const {
        items,
        loading,
        error,
        subtotal,
        shipping,
        tax,
        grandTotal,
        shippingAddress,
        updateShippingAddress,
        processing,
        paymentError,
        paymentSuccess,
        orderId,
        activeStep,
        handleNextStep,
        handlePrevStep,
        handlePayment,
        isStripeReady,
    } = useCheckout();

    const handleGoBack = () => {
        if (activeStep > 0 && !paymentSuccess) {
            handlePrevStep();
        } else {
            navigate('/user/cart');
        }
    };

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
                <Styled.SuccessContainer>
                    <Styled.SuccessTitle>Something went wrong</Styled.SuccessTitle>
                    <Styled.SuccessText>{error}</Styled.SuccessText>
                    <Styled.ContinueShoppingLink to="/user/cart">
                        Return to Cart
                    </Styled.ContinueShoppingLink>
                </Styled.SuccessContainer>
            </Styled.PageContainer>
        );
    }

    if (items.length === 0 && !paymentSuccess) {
        return (
            <Styled.PageContainer>
                <Styled.SuccessContainer>
                    <Styled.SuccessTitle>Your cart is empty</Styled.SuccessTitle>
                    <Styled.SuccessText>Add some items before checkout.</Styled.SuccessText>
                    <Styled.ContinueShoppingLink to="/">Start Shopping</Styled.ContinueShoppingLink>
                </Styled.SuccessContainer>
            </Styled.PageContainer>
        );
    }

    // Success State
    if (paymentSuccess) {
        return (
            <Styled.PageContainer>
                <Styled.SuccessContainer>
                    <Styled.SuccessIcon>
                        <CheckIcon sx={{ fontSize: 40, color: '#10b981' }} />
                    </Styled.SuccessIcon>
                    <Styled.SuccessTitle>Order Confirmed!</Styled.SuccessTitle>
                    <Styled.SuccessText>
                        Thank you for your purchase. Your order has been placed successfully.
                    </Styled.SuccessText>
                    <Styled.OrderId>
                        Order ID: <span>{orderId}</span>
                    </Styled.OrderId>
                    <Styled.ContinueShoppingLink to="/">Continue Shopping</Styled.ContinueShoppingLink>
                </Styled.SuccessContainer>
            </Styled.PageContainer>
        );
    }

    return (
        <Styled.PageContainer>
            <Styled.PageHeader>
                <Styled.BackButton onClick={handleGoBack} aria-label="Go back">
                    <ArrowBackIcon />
                </Styled.BackButton>
                <Styled.PageTitle>Checkout</Styled.PageTitle>
            </Styled.PageHeader>

            {/* Stepper */}
            <Styled.StepperContainer>
                {steps.map((label, index) => (
                    <Styled.StepItem key={label}>
                        <Styled.StepCircle active={activeStep === index} completed={activeStep > index}>
                            {activeStep > index ? <CheckIcon sx={{ fontSize: 16 }} /> : index + 1}
                        </Styled.StepCircle>
                        <Styled.StepLabel active={activeStep === index} completed={activeStep > index}>
                            {label}
                        </Styled.StepLabel>
                        {index < steps.length - 1 && <Styled.StepConnector completed={activeStep > index} />}
                    </Styled.StepItem>
                ))}
            </Styled.StepperContainer>

            <Styled.ContentWrapper>
                {/* Main Form Section */}
                <Styled.FormSection>
                    {paymentError && (
                        <Styled.ErrorAlert>
                            <ErrorOutlineIcon fontSize="small" />
                            {paymentError}
                        </Styled.ErrorAlert>
                    )}

                    {/* Step 1: Shipping Address */}
                    {activeStep === 0 && (
                        <>
                            <Styled.SectionTitle>Shipping Address</Styled.SectionTitle>
                            <Styled.FormGrid>
                                <Styled.FormField fullWidth>
                                    <Styled.StyledTextField
                                        fullWidth
                                        label="Full Name"
                                        value={shippingAddress.fullName}
                                        onChange={(e) => updateShippingAddress('fullName', e.target.value)}
                                        required
                                    />
                                </Styled.FormField>
                                <Styled.FormField fullWidth>
                                    <Styled.StyledTextField
                                        fullWidth
                                        label="Address Line 1"
                                        value={shippingAddress.addressLine1}
                                        onChange={(e) => updateShippingAddress('addressLine1', e.target.value)}
                                        required
                                    />
                                </Styled.FormField>
                                <Styled.FormField fullWidth>
                                    <Styled.StyledTextField
                                        fullWidth
                                        label="Address Line 2 (Optional)"
                                        value={shippingAddress.addressLine2}
                                        onChange={(e) => updateShippingAddress('addressLine2', e.target.value)}
                                    />
                                </Styled.FormField>
                                <Styled.FormField>
                                    <Styled.StyledTextField
                                        fullWidth
                                        label="City"
                                        value={shippingAddress.city}
                                        onChange={(e) => updateShippingAddress('city', e.target.value)}
                                        required
                                    />
                                </Styled.FormField>
                                <Styled.FormField>
                                    <Styled.StyledTextField
                                        fullWidth
                                        label="State / Province"
                                        value={shippingAddress.state}
                                        onChange={(e) => updateShippingAddress('state', e.target.value)}
                                        required
                                    />
                                </Styled.FormField>
                                <Styled.FormField>
                                    <Styled.StyledTextField
                                        fullWidth
                                        label="Postal Code"
                                        value={shippingAddress.postalCode}
                                        onChange={(e) => updateShippingAddress('postalCode', e.target.value)}
                                        required
                                    />
                                </Styled.FormField>
                                <Styled.FormField>
                                    <FormControl fullWidth>
                                        <InputLabel>Country</InputLabel>
                                        <Styled.StyledSelect
                                            label="Country"
                                            value={shippingAddress.country}
                                            onChange={(e) =>
                                                updateShippingAddress('country', e.target.value as string)
                                            }
                                        >
                                            <MenuItem value="US">United States</MenuItem>
                                            <MenuItem value="CA">Canada</MenuItem>
                                            <MenuItem value="GB">United Kingdom</MenuItem>
                                            <MenuItem value="AU">Australia</MenuItem>
                                            <MenuItem value="IN">India</MenuItem>
                                        </Styled.StyledSelect>
                                    </FormControl>
                                </Styled.FormField>
                                <Styled.FormField fullWidth>
                                    <Styled.StyledTextField
                                        fullWidth
                                        label="Phone Number"
                                        value={shippingAddress.phone}
                                        onChange={(e) => updateShippingAddress('phone', e.target.value)}
                                        required
                                    />
                                </Styled.FormField>
                            </Styled.FormGrid>
                            <Styled.ButtonGroup>
                                <Styled.SecondaryButton onClick={() => navigate('/user/cart')}>
                                    Back to Cart
                                </Styled.SecondaryButton>
                                <Styled.PrimaryButton fullWidth onClick={handleNextStep}>
                                    Continue to Payment
                                </Styled.PrimaryButton>
                            </Styled.ButtonGroup>
                        </>
                    )}

                    {/* Step 2: Payment */}
                    {activeStep === 1 && (
                        <>
                            <Styled.SectionTitle>Payment Details</Styled.SectionTitle>
                            <Styled.CardElementWrapper>
                                <CardElement options={CARD_ELEMENT_OPTIONS} />
                            </Styled.CardElementWrapper>
                            <Styled.CardBrands>
                                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/visa/visa-original.svg" alt="Visa" />
                                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mastercard/mastercard-original.svg" alt="Mastercard" />
                            </Styled.CardBrands>
                            <Styled.SecureBadge>
                                <LockOutlinedIcon sx={{ fontSize: 14 }} />
                                Your payment is secure and encrypted
                            </Styled.SecureBadge>
                            <Styled.ButtonGroup>
                                <Styled.SecondaryButton onClick={handlePrevStep}>Back</Styled.SecondaryButton>
                                <Styled.PrimaryButton
                                    fullWidth
                                    onClick={handlePayment}
                                    disabled={processing || !isStripeReady}
                                >
                                    {processing ? (
                                        <CircularProgress size={20} sx={{ color: '#fff' }} />
                                    ) : (
                                        <>
                                            <LockOutlinedIcon sx={{ fontSize: 18 }} />
                                            Pay ${grandTotal.toFixed(2)}
                                        </>
                                    )}
                                </Styled.PrimaryButton>
                            </Styled.ButtonGroup>
                        </>
                    )}
                </Styled.FormSection>

                {/* Order Summary Sidebar */}
                <Styled.SummarySection>
                    <Styled.SummaryTitle>Order Summary</Styled.SummaryTitle>

                    {items.map((item) => (
                        <Styled.SummaryItem key={item.cart_id}>
                            <Styled.SummaryItemImage
                                src={item.image}
                                alt={item.title}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                        'https://via.placeholder.com/64?text=No+Image';
                                }}
                            />
                            <Styled.SummaryItemDetails>
                                <Styled.SummaryItemTitle>{item.title}</Styled.SummaryItemTitle>
                                <Styled.SummaryItemMeta>Qty: {item.quantity}</Styled.SummaryItemMeta>
                            </Styled.SummaryItemDetails>
                            <Styled.SummaryItemPrice>${item.total.toFixed(2)}</Styled.SummaryItemPrice>
                        </Styled.SummaryItem>
                    ))}

                    <Styled.SummaryDivider />

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
                        <Styled.SummaryLabel>Tax</Styled.SummaryLabel>
                        <Styled.SummaryValue>${tax.toFixed(2)}</Styled.SummaryValue>
                    </Styled.SummaryRow>
                    <Styled.SummaryRow isTotal>
                        <Styled.SummaryLabel isTotal>Total</Styled.SummaryLabel>
                        <Styled.SummaryValue isTotal>${grandTotal.toFixed(2)}</Styled.SummaryValue>
                    </Styled.SummaryRow>
                </Styled.SummarySection>
            </Styled.ContentWrapper>
        </Styled.PageContainer>
    );
};

// Wrap with Stripe Elements Provider
const CheckoutPage = () => {
    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm />
        </Elements>
    );
};

export default CheckoutPage;

