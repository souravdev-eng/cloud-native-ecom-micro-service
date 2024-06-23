package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/souravdev-eng/cn-review-service/src/db"
	"github.com/souravdev-eng/cn-review-service/src/models"
)

func NewReview(c *gin.Context) {
	review := models.Review{
		Id:         1,
		ReviewText: "Good product!",
		Rating:     4,
	}

	db.DB.Create(&review)
	c.JSON(http.StatusOK, gin.H{"data": review})

}
