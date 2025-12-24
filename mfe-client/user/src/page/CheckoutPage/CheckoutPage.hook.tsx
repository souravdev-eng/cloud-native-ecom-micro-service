import { useState, useEffect, useCallback } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { cartApi, orderApi } from '../../api/baseUrl';

interface CartItem {
    product_id: string;
    cart_id: string;
    title: string;
    image: string;
    price: number;
    quantity: number;
    total: number;
}

interface ShippingAddress {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
}

interface CheckoutState {
    items: CartItem[];
    loading: boolean;
    error: string | null;
    subtotal: number;
    shipping: number;
    tax: number;
    grandTotal: number;
}

const initialShippingAddress: ShippingAddress = {
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN', // Default to India
    phone: '',
};

export const useCheckout = () => {
    const stripe = useStripe();
    const elements = useElements();

    const [checkoutState, setCheckoutState] = useState<CheckoutState>({
        items: [],
        loading: true,
        error: null,
        subtotal: 0,
        shipping: 0,
        tax: 0,
        grandTotal: 0,
    });

    const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(initialShippingAddress);
    const [processing, setProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState(0);

    const fetchCart = useCallback(async () => {
        try {
            setCheckoutState((prev) => ({ ...prev, loading: true, error: null }));
            const response = await cartApi.get('/');
            const items = response.data.carts || [];
            const subtotal = response.data.total || 0;
            const shipping = subtotal > 100 ? 0 : 9.99;
            const tax = subtotal * 0.08;
            const grandTotal = subtotal + shipping + tax;

            setCheckoutState({
                items,
                loading: false,
                error: null,
                subtotal,
                shipping,
                tax,
                grandTotal,
            });
        } catch (err: any) {
            setCheckoutState((prev) => ({
                ...prev,
                loading: false,
                error: err.response?.data?.message || 'Failed to load cart',
            }));
        }
    }, []);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const updateShippingAddress = (field: keyof ShippingAddress, value: string) => {
        setShippingAddress((prev) => ({ ...prev, [field]: value }));
    };

    const validateShippingAddress = (): boolean => {
        const required: (keyof ShippingAddress)[] = [
            'fullName',
            'addressLine1',
            'city',
            'state',
            'postalCode',
            'country',
            'phone',
        ];
        return required.every((field) => shippingAddress[field]?.trim());
    };

    const handleNextStep = () => {
        if (activeStep === 0 && !validateShippingAddress()) {
            setPaymentError('Please fill in all required shipping fields');
            return;
        }
        setPaymentError(null);
        setActiveStep((prev) => prev + 1);
    };

    const handlePrevStep = () => {
        setPaymentError(null);
        setActiveStep((prev) => prev - 1);
    };

    const handlePayment = async () => {
        if (!stripe || !elements) {
            setPaymentError('Stripe is not loaded yet');
            return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setPaymentError('Card element not found');
            return;
        }

        setProcessing(true);
        setPaymentError(null);

        try {
            // Step 1: Create order with backend first
            const cartIds = checkoutState.items.map((item) => item.cart_id);
            const orderResponse = await orderApi.post('/order', {
                cartIds,
                shippingAddress: {
                    ...shippingAddress,
                    phoneNumber: shippingAddress.phone,
                },
                paymentMethod: 'card',
                notes: '',
            });

            if (!orderResponse.data.success) {
                setPaymentError(orderResponse.data.message || 'Order creation failed');
                setProcessing(false);
                return;
            }

            const createdOrderId = orderResponse.data.order.id;
            setOrderId(createdOrderId);

            // Step 2: Create payment intent for the order
            // Currency: INR for Indian export regulations compliance
            const paymentIntentResponse = await orderApi.post(`/order/${createdOrderId}/payment-intent`, {
                currency: 'inr',
            });

            if (!paymentIntentResponse.data.success) {
                setPaymentError(paymentIntentResponse.data.message || 'Failed to initialize payment');
                setProcessing(false);
                return;
            }

            const { clientSecret, paymentIntentId } = paymentIntentResponse.data;

            // Step 3: Confirm payment with Stripe using client secret
            const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: shippingAddress.fullName,
                        phone: shippingAddress.phone,
                        address: {
                            line1: shippingAddress.addressLine1,
                            line2: shippingAddress.addressLine2 || undefined,
                            city: shippingAddress.city,
                            state: shippingAddress.state,
                            postal_code: shippingAddress.postalCode,
                            country: shippingAddress.country,
                        },
                    },
                },
            });

            if (confirmError) {
                setPaymentError(confirmError.message || 'Payment failed');
                setProcessing(false);
                return;
            }

            // Step 4: Confirm payment with backend
            if (paymentIntent?.status === 'succeeded') {
                await orderApi.post(`/order/${createdOrderId}/confirm-payment`, {
                    paymentIntentId,
                });

                setPaymentSuccess(true);
                setActiveStep(2);
            } else {
                setPaymentError(`Payment status: ${paymentIntent?.status}. Please try again.`);
            }
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.errors?.[0]?.message ||
                err.response?.data?.message ||
                'Payment processing failed';
            setPaymentError(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    return {
        ...checkoutState,
        shippingAddress,
        updateShippingAddress,
        validateShippingAddress,
        processing,
        paymentError,
        paymentSuccess,
        orderId,
        activeStep,
        handleNextStep,
        handlePrevStep,
        handlePayment,
        isStripeReady: !!stripe && !!elements,
    };
};

