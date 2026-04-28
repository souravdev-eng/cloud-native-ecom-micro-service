import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import SmallProductCard from '../SmallProductCard/SmallProductCard';

interface SmallProductCardListProps {
    title: string;
    products: { id?: string; title: string; price: number; image: string }[];
}

const SmallProductCardList = ({ title, products }: SmallProductCardListProps) => {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minWidth: 220,
                maxWidth: 300,
            }}
        >
            <Typography
                sx={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#212529',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #228be6',
                    marginBottom: '4px',
                }}
            >
                {title}
            </Typography>
            {products.map((product) => (
                <SmallProductCard
                    key={product.id}
                    title={product.title}
                    price={product.price}
                    image={product.image}
                    onClick={product.id ? () => navigate(`/product/${product.id}`) : undefined}
                />
            ))}
        </Box>
    );
};

export default SmallProductCardList;
