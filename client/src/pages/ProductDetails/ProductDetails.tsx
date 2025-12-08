import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  TextField,
  Chip,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Remove,
  ShoppingCart
} from '@mui/icons-material';
import { useProductDetails } from './ProductDetails.hooks';
import { useCart } from '../Cart/Cart.hook';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [addToCartSuccess, setAddToCartSuccess] = useState(false);

  const { product, loading, error } = useProductDetails(id);
  const { addToCart, loading: cartLoading } = useCart();

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.quantity || 1)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (product) {
      try {
        await addToCart(product.id, quantity);
        setAddToCartSuccess(true);
        setTimeout(() => setAddToCartSuccess(false), 3000);
      } catch (error) {
        console.error('Failed to add to cart:', error);
      }
    }
  };

  const handleGoToCart = () => {
    navigate('/cart');
  };

  const handleBackToProducts = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Product not found'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackToProducts}
          variant="outlined"
        >
          Back to Products
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={handleBackToProducts}
        sx={{ mb: 3 }}
        variant="outlined"
      >
        Back to Products
      </Button>

      {/* Success Alert */}
      {addToCartSuccess && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleGoToCart}>
              Go to Cart
            </Button>
          }
        >
          Product added to cart successfully!
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Product Image */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardMedia
              component="img"
              height="400"
              image={product.image}
              alt={product.title}
              sx={{ objectFit: 'cover' }}
            />
          </Card>
        </Grid>

        {/* Product Details */}
        <Grid item xs={12} md={6}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {product.title}
            </Typography>

            <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
              ${product.price.toFixed(2)}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Chip
                label={product.category}
                color="secondary"
                variant="outlined"
                sx={{ mr: 1 }}
              />
              <Chip
                label={`Rating: ${product.rating || 4.5}/5`}
                color="primary"
                variant="outlined"
              />
            </Box>

            <Typography variant="body1" paragraph sx={{ mb: 3 }}>
              {product.description}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Available Stock: {product.quantity}
              </Typography>
              {product.tags && product.tags.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  {product.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            {/* Quantity Selector */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Quantity:
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <IconButton
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  size="small"
                >
                  <Remove />
                </IconButton>
                <TextField
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    if (val >= 1 && val <= product.quantity) {
                      setQuantity(val);
                    }
                  }}
                  size="small"
                  sx={{ width: 80 }}
                  inputProps={{
                    style: { textAlign: 'center' },
                    min: 1,
                    max: product.quantity
                  }}
                />
                <IconButton
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.quantity}
                  size="small"
                >
                  <Add />
                </IconButton>
              </Box>
            </Box>

            {/* Add to Cart Button */}
            <Button
              variant="contained"
              size="large"
              startIcon={<ShoppingCart />}
              onClick={handleAddToCart}
              disabled={cartLoading || product.quantity === 0}
              sx={{ mr: 2, mb: 2 }}
            >
              {cartLoading ? 'Adding...' : 'Add to Cart'}
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={handleGoToCart}
              sx={{ mb: 2 }}
            >
              View Cart
            </Button>

            {product.quantity === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This product is currently out of stock.
              </Alert>
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProductDetails;
