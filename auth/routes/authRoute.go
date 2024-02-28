package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/souravdev-eng/cloud-native-ecom-auth/controllers"
)

func AuthRoutes(r *gin.Engine) {
	r.POST("/user/signup", controllers.Signup())
}
