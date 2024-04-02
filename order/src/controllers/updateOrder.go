package controllers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func UpdateOrder() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		data := fmt.Sprintf("Product updated id is %v", id)
		c.JSON(http.StatusOK, gin.H{"message": data})
	}
}
