package controllers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/souravdev-eng/ecom-order/src/database"
	"github.com/souravdev-eng/ecom-order/src/models"
	"go.mongodb.org/mongo-driver/mongo"
)

var orderCollection *mongo.Collection = database.OpenCollection(database.Client, "order")
var validate = validator.New()

func CreateNewOrder() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var order models.Order

		if err := c.BindJSON(&order); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"errors": err.Error()})
			return
		}

		validatorError := validate.Struct(order)

		if validatorError != nil {
			c.JSON(http.StatusBadRequest, gin.H{"errors": validatorError.Error()})
			return
		}

		order.Created_at, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
		order.Updated_at, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))

		_, insertErr := orderCollection.InsertOne(ctx, order)
		if insertErr != nil {
			msg := fmt.Sprintf("Order item was not able to create! %v", insertErr)
			c.JSON(http.StatusBadRequest, gin.H{"errors": msg})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Order created successfully"})
	}
}
