package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetAllOrder() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Show all product "})
	}
}
