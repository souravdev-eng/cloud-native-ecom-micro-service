package main

import "github.com/gin-gonic/gin"

func main() {
	r := gin.Default()
	r.GET("/api/order/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})
	r.Run(":4000")
}
