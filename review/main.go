package main

import (
	"github.com/gin-gonic/gin"
	"github.com/souravdev-eng/cn-review-service/src/controllers"
	"github.com/souravdev-eng/cn-review-service/src/db"
)

func main() {
	gin.ForceConsoleColor()
	r := gin.Default()
	db.InitDB()

	r.POST("/api/review/ping", controllers.NewReview)
	r.Run(":3000")
}
