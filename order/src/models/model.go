package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Order struct {
	ID         primitive.ObjectID `bson:"id"`
	ProductId  *string            `json:"productId"`
	CustomerId *string            `json:"customerId"`
	Quantity   *int               `json:"quantity"`
	Status     *string            `json:"status" validate:"required,eq=PENDING|eq=SUCCESS|eq=FAILED"`
	Created_at time.Time          `json:"createdAt"`
	Updated_at time.Time          `json:"updatedAt"`
}
