package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID         primitive.ObjectID `bson:"_id"`
	Name       *string            `json:"name"`
	Email      *string            `json:"email" validate:"email,required"`
	Password   *string            `json:"password" validate:"required,min=6"`
	Created_at time.Time          `json:"createdAt"`
	Updated_at time.Time          `json:"updatedAt"`
}
