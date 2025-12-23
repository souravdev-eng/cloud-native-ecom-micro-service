import { useEffect, useState } from "react"
import { cartApi, productApi } from "../../api/baseUrl"
import { useParams } from "react-router-dom"
// import { toast } from "react-toastify"

export interface IProductDetails {
    id: string
    title: string
    price: number
    image: string
    description: string
}

export const useProductDetails = () => {
    const [product, setProduct] = useState<IProductDetails | null>(null)
    const { id } = useParams()

    useEffect(() => {
        productApi.get(`/${id}`).then((res) => {
            setProduct(res?.data)
        }).catch((err) => {
            console.log(err)
        })
    }, [])


    const handleAddToCart = async () => {
        try {
            const res = await cartApi.post(`/`, { id, quantity: 1 })
            if (res) {
                console.log("Product added to cart", res)
            }
        } catch (err: any) {
            console.log("Error adding to cart", err)
        }
    }

    return { product, handleAddToCart }
}