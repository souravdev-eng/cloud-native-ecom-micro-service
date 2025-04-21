package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sourav-dev/review/internal/handlers"
)

func UserRoutes(routes *gin.Engine) {
	routes.POST("/review/create-user", handlers.CreateUser())
	routes.GET("/review/show-all-user", handlers.ShowAllUser())
}
