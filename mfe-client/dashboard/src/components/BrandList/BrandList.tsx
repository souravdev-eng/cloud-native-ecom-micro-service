import React from 'react'
import { Box } from '@mui/material'

const BrandListData = [
    {
        id: 1,
        name: 'Brand 1',
        image: 'https://porto-demo.myshopify.com/cdn/shop/files/new_brand1_180x79.png?v=1614359661'
    },
    {
        id: 2,
        name: 'Brand 2',
        image: 'https://porto-demo.myshopify.com/cdn/shop/files/new_brand2_180x79.png?v=1614359661'
    },
    {
        id: 3,
        name: 'Brand 3',
        image: 'https://porto-demo.myshopify.com/cdn/shop/files/new_brand3_180x79.png?v=1614359661'
    },
    {
        id: 4,
        name: 'Brand 4',
        image: 'https://porto-demo.myshopify.com/cdn/shop/files/new_brand4_180x79.png?v=1614359661'
    },
    {
        id: 5,
        name: 'Brand 5',
        image: 'https://porto-demo.myshopify.com/cdn/shop/files/new_brand5_180x79.png?v=1614359661'
    },
    {
        id: 6,
        name: 'Brand 6',
        image: 'https://porto-demo.myshopify.com/cdn/shop/files/new_brand6_180x79.png?v=1614359661'
    },

]

const BrandList = () => {
    return (
        <Box sx={{
            display: 'flex', gap: 10, justifyContent: 'center',
            alignItems: 'center', flexWrap: 'wrap', padding: '40px 0px',
        }}>
            {BrandListData.map((brand) => (
                <img src={brand.image}
                    alt={brand.name}
                    width={160}
                    height={60}
                    key={brand.id}
                />
            ))}
        </Box>
    )
}

export default BrandList