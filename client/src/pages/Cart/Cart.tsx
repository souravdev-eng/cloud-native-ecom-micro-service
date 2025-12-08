import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  TextField,
  Divider,
  Alert,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Delete,
  Add,
  Remove,
  ShoppingCartOutlined,
  ArrowBack
} from '@mui/icons-material';
import { useCart } from './Cart.hook';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    loading,
    error,
    updateQuantity,
    removeFromCart,
    getTotalItems,
    getTotalPrice,
  } = useCart();

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      await updateQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeFromCart(itemId);
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  const handleProceedToCheckout = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  console.log(cartItems, 'cartItems');
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" component="h1">
          Shopping Cart
        </Typography>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleContinueShopping}
          variant="outlined"
        >
          Continue Shopping
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {cartItems?.length === 0 ? (
        // Empty Cart State
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <ShoppingCartOutlined sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Your cart is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Looks like you haven't added any items to your cart yet.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleContinueShopping}
          >
            Start Shopping
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Cart Items */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Cart Items ({getTotalItems()})
            </Typography>

            {cartItems?.map((item) => (
              <Card key={item.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    {/* Product Image */}
                    <Grid item xs={12} sm={3}>
                      <CardMedia
                        component="img"
                        height="120"
                        image={item?.image}
                        alt={item?.title}
                        sx={{ objectFit: 'cover', borderRadius: 1 }}
                      />
                    </Grid>

                    {/* Product Details */}
                    <Grid item xs={12} sm={5}>
                      <Typography variant="h6" gutterBottom>
                        {item?.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Category: {item?.category || 'N/A'}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        ${item?.price?.toFixed(2)}
                      </Typography>
                    </Grid>

                    {/* Quantity Controls */}
                    <Grid item xs={12} sm={3}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item?.product_id, item?.quantity - 1)}
                          disabled={item?.quantity <= 1}
                        >
                          <Remove />
                        </IconButton>
                        <TextField
                          value={item?.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            handleQuantityChange(item?.id, val);
                          }}
                          size="small"
                          sx={{ width: 60 }}
                          inputProps={{
                            style: { textAlign: 'center' },
                            min: 1
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item?.id, item?.quantity + 1)}
                        >
                          <Add />
                        </IconButton>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Subtotal: ${(item?.price * item?.quantity).toFixed(2)}
                      </Typography>
                    </Grid>

                    {/* Remove Button */}
                    <Grid item xs={12} sm={1}>
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveItem(item?.id)}
                        sx={{ float: 'right' }}
                      >
                        <Delete />
                      </IconButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>

              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body1">
                  Items ({getTotalItems()}):
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

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between" mb={3}>
                <Typography variant="h6">
                  Total:
                </Typography>
                <Typography variant="h6" color="primary">
                  ${getTotalPrice().toFixed(2)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleProceedToCheckout}
                sx={{ mb: 2 }}
              >
                Proceed to Checkout
              </Button>

              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={handleContinueShopping}
              >
                Continue Shopping
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default Cart;
