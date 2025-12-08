import { useEffect } from "react"
import { useState } from "react"
import { cartApi, productApi } from "../../api/baseUrl"

export const useHome = () => {

    const [productList, setProductList] = useState([])

    useEffect(() => {
        productApi.get("/?fields=title, image, price, rating&limit=6").then((res) => {
            setProductList(res?.data?.data)
        }).catch((err) => {
            console.log(err)
        })
    }, [])

    const addToCart = async (productId: string, quantity: number) => {
        try {
            const res = await cartApi.post(`/`, { productId, quantity })
            console.log(res)
        } catch (err: any) {
            if (err.response?.data?.errors?.length > 0) {
                throw new Error(err.response.data.errors.map((error: any) => error.message).join(', '))
            } else if (err.response?.data?.message) {
                throw new Error(err.response.data.message)
            } else {
                throw new Error('Something went wrong')
            }
        }
    }

    return { productList, addToCart }
}