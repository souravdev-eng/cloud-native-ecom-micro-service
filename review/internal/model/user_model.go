package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID        primitive.ObjectID `bson:"-"`
	Name      string             `json:"name" validate:"required"`
	Email     string             `json:"email" validate:"required"`
	CreatedAt time.Time          `json:"created_at"`
}
