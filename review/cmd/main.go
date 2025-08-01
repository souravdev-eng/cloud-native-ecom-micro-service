package main

import (
	"github.com/gin-gonic/gin"

	"github.com/sourav-dev/review/internal/configs"
	"github.com/sourav-dev/review/internal/repository"
	"github.com/sourav-dev/review/internal/routes"
)

func main() {
	router := gin.New()
	router.Use(gin.Logger())
	repository.ConnectDB()
	configs.ConnectAMPQClient()

	routes.UserRoutes(router)

	router.Run(":4000")
}
