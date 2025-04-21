package routes

import "github.com/gin-gonic/gin"

func ReviewRoutes(routes *gin.Engine) {
	routes.GET(":product_id/review/")
	routes.GET(":product_id/review/:id")
}
