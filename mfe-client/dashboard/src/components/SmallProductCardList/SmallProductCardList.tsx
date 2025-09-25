import { Box, Typography } from '@mui/material'
import SmallProductCard from '../SmallProductCard/SmallProductCard'


interface SmallProductCardList {
    title: string
    products: SmallProductCard[]
}

const SmallProductCardList = ({ title, products }: SmallProductCardList) => {
    return (
        <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column', width: 340 }}>
            <Typography variant="h6"
                sx={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {title}
            </Typography>
            {products.map((product) => (
                <SmallProductCard
                    key={product.id}
                    title={product.title}
                    price={product.price}
                    image={product.image}
                />
            ))}

        </Box>
    )
}

export default SmallProductCardList