import { Box } from "@mui/material"
import ProductList from "../../molecules/ProductList/ProductList"
import { useHome } from "./Home.hook"

const HomePage = () => {
    const { productList, addToCart } = useHome()

    return (
        <Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '25px', margin: '10px' }}>
                <ProductList title="FEATURED PRODUCTS" products={productList} handleAddToCart={(productId, quantity) => addToCart(productId, quantity || 1)} />
                <ProductList title="NEW ARRIVALS" products={productList} handleAddToCart={(productId, quantity) => addToCart(productId, quantity || 1)} />
                <ProductList title="BEST SELLER" products={productList} handleAddToCart={(productId, quantity) => addToCart(productId, quantity || 1)} />
                <ProductList title="TOP RATED PRODUCTS" products={productList} handleAddToCart={(productId, quantity) => addToCart(productId, quantity || 1)} />
            </Box>
        </Box>
    )
}

export default HomePage