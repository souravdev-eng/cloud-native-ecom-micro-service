import { Box } from "@mui/material"
import ProductCard from "../../molecules/ProductCard/ProductCard"

const HomePage = () => {
    return (
        <div>
            <h1>Banner</h1>
            <h1>List of product as catalog bases</h1>
            <Box sx={{ display: 'flex', gap: '25px', flexWrap: 'wrap', margin: '10px' }}>
                {Array.from({ length: 10 }).splice(0, 5).map((el, idx) => (
                    <ProductCard key={idx} />
                ))}
            </Box>
        </div>
    )
}

export default HomePage