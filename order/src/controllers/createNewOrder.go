package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/souravdev-eng/ecom-order/src/database"
	"go.mongodb.org/mongo-driver/mongo"
)

var orderCollection *mongo.Collection = database.OpenCollection(database.Client, "order")

func CreateNewOrder() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Product created"})
	}
}
