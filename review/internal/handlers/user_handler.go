package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sourav-dev/review/internal/model"
	"github.com/sourav-dev/review/internal/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func CreateUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		coll := repository.GetUserCollection()

		// Create a new context with timeout
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel() // Ensure the context is canceled when done

		// Define the user struct to bind incoming JSON
		var user model.User

		// Bind incoming JSON to the user struct
		if err := c.BindJSON(&user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Set the CreatedAt field to the current time
		user.CreatedAt = time.Now()

		// Generate a new ObjectID for the user
		user.ID = primitive.NewObjectID()
		// user.UserID = user.ID.Hex()

		// Insert the user into the collection
		_, insertErr := coll.InsertOne(ctx, user)

		// Check for insertion errors
		if insertErr != nil {
			msg := fmt.Sprintf("user item was not created: %v", insertErr)
			c.JSON(http.StatusInternalServerError, gin.H{"error": msg})
			return
		}

		// Return the inserted user's ObjectID as part of the response (converted to string)
		c.JSON(http.StatusOK, gin.H{"data": user})
	}
}

func ShowAllUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		coll := repository.GetUserCollection()

		result, err := coll.Find(context.TODO(), bson.M{})

		defer cancel()

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while fetching user list"})
		}

		var userList []bson.M
		if err = result.All(ctx, &userList); err != nil {
			log.Fatal(err)
		}
		c.JSON(http.StatusOK, userList)
	}
}
