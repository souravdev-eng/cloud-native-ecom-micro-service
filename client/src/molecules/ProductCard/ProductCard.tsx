import { Box, Typography } from '@mui/material'

interface ProductCardProps {
    id?: string
    title: string
    price: number
    image: string
}

const ProductCard = ({ title, price, image }: ProductCardProps) => {
    return (
        <Box sx={{
            width: 300,
            height: 420,
            border: '1px solid #000',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 6,
            padding: 1
        }}>
            <Box sx={{
                width: '100%',
                height: 220,
                backgroundColor: '#F0F0F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'center',
                borderRadius: 6,
                marginBottom: '6px',
                flexShrink: 0
            }}>
                <img src={image}
                    style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 18 }}
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
                    <span style={{ fontSize: 10, backgroundColor: '#ebfbee', borderRadius: 16, color: '#2b8a3e', padding: '4px 10px', fontWeight: '600' }}>
                        Best seller
                    </span>
                    <Typography
                        sx={{
                            margin: '6px 0px',
                            height: 48,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '24px'
                        }}
                    >
                        {title}
                    </Typography>
                    <Typography sx={{ fontWeight: 'bold' }}>${price}</Typography>
                </Box>
                <Box sx={{
                    height: 40,
                    backgroundColor: '#000',
                    textAlign: 'center',
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 14,
                    marginTop: '12px',
                    marginBottom: '6px',
                    cursor: 'pointer',
                    flexShrink: 0
                }}>
                    <Typography>Add To Cart</Typography>
                </Box>
            </Box>
        </Box>
    )
}

export default ProductCard