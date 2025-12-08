import { Box, Typography } from "@mui/material"
import ProductCard from "../ProductCard/ProductCard"

interface Product {
    id: string
    title: string
    price: number
    image: string
}

interface ProductListProps {
    title: string
    products: Product[]
    handleAddToCart: (productId: string, quantity?: number) => void
}


const ProductList = ({ title, products, handleAddToCart }: ProductListProps) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', marginBottom: '40px' }}>
            <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>{title}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                {products?.length > 0 && products.map((product) => (
                    <ProductCard key={product.id} id={product.id} title={product.title} price={product.price} image={product.image}
                        handleAddToCart={handleAddToCart}
                    />
                ))}
            </Box>
        </Box>
    )
}

export default ProductList