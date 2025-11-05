import { Box, Typography } from '@mui/material'
import React from 'react'
import * as Styled from './SmallProductCard.style.tsx'


interface SmallProductCard {
    id?: string
    title: string
    price: number
    image: string
}

const SmallProductCard = ({ title, price, image }: SmallProductCard) => {
    console.log(image)
    return (
        <Styled.Container>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                <Styled.Image src={image} alt="Product" />
                <Box>
                    <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: '400' }}>{title}</Typography>
                    <Typography variant="body1" sx={{ fontSize: '14px', fontWeight: 'bold' }}>${price}</Typography>
                </Box>
            </Box>
        </Styled.Container>
    )
}

export default SmallProductCard