import { app } from "./app";

const startServer = async () => {
    try {
        app.listen(4000, () => {
            console.log("Order Service running on port: 4000")
        })
    } catch (error) {
        console.error("Something went wrong")
    }
}

startServer()