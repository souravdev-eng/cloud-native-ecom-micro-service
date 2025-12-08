import { Box, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

interface ProductCardProps {
    id: string
    title: string
    price: number
    image: string
    handleAddToCart: (productId: string, quantity?: number) => void
}

const ProductCard = ({ id, title, price, image, handleAddToCart }: ProductCardProps) => {
    const navigate = useNavigate();

    const handleViewDetails = () => {
        navigate(`/product/${id}`);
    };

    return (
        <Box
            onClick={handleViewDetails}
            sx={{
                cursor: 'pointer',
                width: 300,
                height: 450,
                border: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                padding: 2,
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}>
            <Box sx={{
                width: '100%',
                height: 220,
                backgroundColor: '#F8F9FA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'center',
                borderRadius: 2,
                marginBottom: 2,
                flexShrink: 0,
                cursor: 'pointer',
                overflow: 'hidden'
            }}
                onClick={handleViewDetails}
            >
                <img src={image}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 8,
                        transition: 'transform 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                />
            </Box>
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                justifyContent: 'space-between'
            }}>
                <Box>
                    <span style={{
                        fontSize: 10,
                        backgroundColor: '#e8f5e8',
                        borderRadius: 12,
                        color: '#2e7d32',
                        padding: '4px 8px',
                        fontWeight: '600'
                    }}>
                        Best seller
                    </span>
                    <Typography
                        sx={{
                            margin: '8px 0px',
                            height: 48,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '24px',
                            fontSize: '14px',
                            fontWeight: 500,
                        }}
                        onClick={handleViewDetails}
                    >
                        {title}
                    </Typography>
                    <Typography sx={{
                        fontWeight: 'bold',
                        fontSize: '18px',
                        color: 'primary.main',
                        mb: 2
                    }}>
                        ${price}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', backgroundColor: '#212529', padding: 1, borderRadius: 2, color: 'white' }}>
                    <Typography
                        onClick={() => handleAddToCart(id, 1)}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'uppercase',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'center',
                        }}
                    >
                        Add To Cart
                    </Typography>
                </Box>
            </Box>
        </Box>
    )
}

export default ProductCard