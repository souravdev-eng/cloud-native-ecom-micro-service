package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/souravdev-eng/ecom-order/src/controllers"
)

func OrderRoutes(r *gin.Engine) {
	r.POST("/api/order/", controllers.CreateNewOrder())
	r.GET("/api/order/", controllers.GetAllOrder())
	r.PUT("/api/order/:id", controllers.UpdateOrder())
}
