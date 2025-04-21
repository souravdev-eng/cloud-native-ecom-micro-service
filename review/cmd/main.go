package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/sourav-dev/review/internal/repository"
	"github.com/sourav-dev/review/internal/routes"
)

func main() {
	err := godotenv.Load()

	if err != nil {
		log.Fatal("Error loading .env file")
	}

	router := gin.New()
	router.Use(gin.Logger())
	repository.ConnectDB()

	routes.UserRoutes(router)

	router.Run(":3000")
}
