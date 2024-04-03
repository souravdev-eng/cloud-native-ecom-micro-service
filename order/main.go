package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/souravdev-eng/ecom-order/src/routes"
)

func main() {

	router := gin.Default()

	routes.OrderRoutes(router)

	router.GET("/api/order/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"health": "OK"})
	})

	router.Run(":4000")
}
