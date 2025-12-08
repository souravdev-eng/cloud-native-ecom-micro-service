import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack,
  CreditCard,
  LocalShipping,
  CheckCircle
} from '@mui/icons-material';
import { useCart } from '../Cart/Cart.hook';
import { useCheckout } from './Checkout.hooks';

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, getTotalPrice, getTotalItems, clearCart } = useCart();
  const { placeOrder, loading: orderLoading } = useCheckout();

  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });

  const [errors, setErrors] = useState<Partial<ShippingInfo>>({});

  const handleInputChange = (field: keyof ShippingInfo) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setShippingInfo(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateShippingInfo = (): boolean => {
    const newErrors: Partial<ShippingInfo> = {};

    if (!shippingInfo.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!shippingInfo.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!shippingInfo.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(shippingInfo.email)) newErrors.email = 'Email is invalid';
    if (!shippingInfo.phone.trim()) newErrors.phone = 'Phone is required';
    if (!shippingInfo.address.trim()) newErrors.address = 'Address is required';
    if (!shippingInfo.city.trim()) newErrors.city = 'City is required';
    if (!shippingInfo.state.trim()) newErrors.state = 'State is required';
    if (!shippingInfo.zipCode.trim()) newErrors.zipCode = 'Zip code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToPayment = () => {
    if (validateShippingInfo()) {
      setCurrentStep(2);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setOrderError(null);

      const orderData = {
        items: cartItems.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
          price: item.price
        })),
        shippingInfo,
        paymentMethod,
        total: getTotalPrice()
      };

      await placeOrder(orderData);
      await clearCart();
      setOrderSuccess(true);
      setCurrentStep(3);
    } catch (error: any) {
      setOrderError(error.message || 'Failed to place order');
    }
  };

  const handleBackToCart = () => {
    navigate('/cart');
  };

  const handleBackToShopping = () => {
    navigate('/');
  };

  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Your cart is empty. Please add items to your cart before checkout.
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackToShopping}
          variant="outlined"
        >
          Continue Shopping
        </Button>
      </Container>
    );
  }

  if (orderSuccess) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Order Placed Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Thank you for your order. You will receive a confirmation email shortly.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleBackToShopping}
            sx={{ mt: 2 }}
          >
            Continue Shopping
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" component="h1">
          Checkout
        </Typography>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackToCart}
          variant="outlined"
        >
          Back to Cart
        </Button>
      </Box>

      {orderError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {orderError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {currentStep === 1 && (
            <Paper sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <LocalShipping sx={{ mr: 1 }} />
                <Typography variant="h6">Shipping Information</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={shippingInfo.firstName}
                    onChange={handleInputChange('firstName')}
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={shippingInfo.lastName}
                    onChange={handleInputChange('lastName')}
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={shippingInfo.email}
                    onChange={handleInputChange('email')}
                    error={!!errors.email}
                    helperText={errors.email}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={shippingInfo.phone}
                    onChange={handleInputChange('phone')}
                    error={!!errors.phone}
                    helperText={errors.phone}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={shippingInfo.address}
                    onChange={handleInputChange('address')}
                    error={!!errors.address}
                    helperText={errors.address}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="City"
                    value={shippingInfo.city}
                    onChange={handleInputChange('city')}
                    error={!!errors.city}
                    helperText={errors.city}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="State"
                    value={shippingInfo.state}
                    onChange={handleInputChange('state')}
                    error={!!errors.state}
                    helperText={errors.state}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Zip Code"
                    value={shippingInfo.zipCode}
                    onChange={handleInputChange('zipCode')}
                    error={!!errors.zipCode}
                    helperText={errors.zipCode}
                    required
                  />
                </Grid>
              </Grid>

              <Box mt={3}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleContinueToPayment}
                >
                  Continue to Payment
                </Button>
              </Box>
            </Paper>
          )}

          {currentStep === 2 && (
            <Paper sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <CreditCard sx={{ mr: 1 }} />
                <Typography variant="h6">Payment Method</Typography>
              </Box>

              <FormControl component="fieldset">
                <FormLabel component="legend">Select Payment Method</FormLabel>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <FormControlLabel
                    value="credit-card"
                    control={<Radio />}
                    label="Credit Card"
                  />
                  <FormControlLabel
                    value="paypal"
                    control={<Radio />}
                    label="PayPal"
                  />
                  <FormControlLabel
                    value="cash-on-delivery"
                    control={<Radio />}
                    label="Cash on Delivery"
                  />
                </RadioGroup>
              </FormControl>

              <Box mt={3} display="flex" gap={2}>
                <Button
                  variant="outlined"
                  onClick={() => setCurrentStep(1)}
                >
                  Back to Shipping
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handlePlaceOrder}
                  disabled={orderLoading}
                  startIcon={orderLoading ? <CircularProgress size={20} /> : null}
                >
                  {orderLoading ? 'Placing Order...' : 'Place Order'}
                </Button>
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>

            <List dense>
              {cartItems?.map((item) => (
                <ListItem key={item?.id} sx={{ px: 0 }}>
                  <ListItemText
                    primary={item?.title}
                    secondary={`Qty: ${item?.quantity}`}
                  />
                  <Typography variant="body2">
                    ${(item?.price * item?.quantity).toFixed(2)}
                  </Typography>
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body1">
                Subtotal ({getTotalItems()} items):
              </Typography>
              <Typography variant="body1">
                ${getTotalPrice().toFixed(2)}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body1">
                Shipping:
              </Typography>
              <Typography variant="body1">
                Free
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body1">
                Tax:
              </Typography>
              <Typography variant="body1">
                ${(getTotalPrice() * 0.08).toFixed(2)}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6">
                Total:
              </Typography>
              <Typography variant="h6" color="primary">
                ${(getTotalPrice() * 1.08).toFixed(2)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Checkout;
