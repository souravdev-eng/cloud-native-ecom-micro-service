import { useEffect, useState } from "react"
import { productApi } from "../../api/baseUrl"

export const useHomePage = () => {
    const [productList, setProductList] = useState([])

    useEffect(() => {
        productApi.get("/?fields=title, image, price, rating&limit=6").then((res) => {
            setProductList(res?.data?.data)
        }).catch((err) => {
            console.log(err)
        })
    }, [])

    return { productList }
}