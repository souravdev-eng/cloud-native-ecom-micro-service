import { Box } from "@mui/material"
import { useEffect, useState } from "react"

import ProductList from "../../molecules/ProductList/ProductList"
import { productApi } from "../../api/baseUrl"

const HomePage = () => {
    const [productList, setProductList] = useState([])

    useEffect(() => {
        productApi.get("/?fields=title, image, price, rating&limit=6").then((res) => {
            setProductList(res?.data?.data)
        }).catch((err) => {
            console.log(err)
        })
    }, [])

    return (
        <Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '25px', margin: '10px' }}>
                <ProductList title="FEATURED PRODUCTS" products={productList} />
                <ProductList title="NEW ARRIVALS" products={productList} />
                <ProductList title="BEST SELLER" products={productList} />
                <ProductList title="TOP RATED PRODUCTS" products={productList} />
            </Box>
        </Box>
    )
}

export default HomePage