import { Box, Typography } from '@mui/material';

const BrandListData = [
    { id: 1, name: 'Brand 1', image: 'https://porto-demo.myshopify.com/cdn/shop/files/new_brand1_180x79.png?v=1614359661' },
    { id: 2, name: 'Brand 2', image: 'https://porto-demo.myshopify.com/cdn/shop/files/new_brand2_180x79.png?v=1614359661' },
    { id: 3, name: 'Brand 3', image: 'https://porto-demo.myshopify.com/cdn/shop/files/new_brand3_180x79.png?v=1614359661' },
    { id: 4, name: 'Brand 4', image: 'https://porto-demo.myshopify.com/cdn/shop/files/new_brand4_180x79.png?v=1614359661' },
    { id: 5, name: 'Brand 5', image: 'https://porto-demo.myshopify.com/cdn/shop/files/new_brand5_180x79.png?v=1614359661' },
    { id: 6, name: 'Brand 6', image: 'https://porto-demo.myshopify.com/cdn/shop/files/new_brand6_180x79.png?v=1614359661' },
];

const BrandList = () => {
    return (
        <Box sx={{ backgroundColor: '#fff', padding: '48px 40px' }}>
            <Typography
                sx={{
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    color: '#adb5bd',
                    marginBottom: '28px',
                }}
            >
                Trusted by top brands
            </Typography>
            <Box
                sx={{
                    display: 'flex',
                    gap: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    maxWidth: 900,
                    margin: '0 auto',
                }}
            >
                {BrandListData.map((brand) => (
                    <Box
                        key={brand.id}
                        sx={{
                            flex: '1 1 140px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '16px 24px',
                            borderRight: '1px solid #f1f3f5',
                            borderBottom: '1px solid #f1f3f5',
                            transition: 'opacity 0.2s',
                            opacity: 0.55,
                            '&:hover': { opacity: 1 },
                            '&:nth-of-type(6n)': { borderRight: 'none' },
                        }}
                    >
                        <img
                            src={brand.image}
                            alt={brand.name}
                            style={{ maxWidth: 120, maxHeight: 48, objectFit: 'contain', filter: 'grayscale(100%)' }}
                        />
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default BrandList;
