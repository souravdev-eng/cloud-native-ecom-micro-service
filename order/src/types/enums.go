package enums

// Exchange represents the different types of exchange events
type Exchange string

// Define constants for each exchange event
const (
	SellerCreated     Exchange = "seller-created"
	SellerUpdated     Exchange = "seller-updated"
	ProductCreated    Exchange = "product-created"
	ProductUpdated    Exchange = "product-updated"
	ProductDeleted    Exchange = "product-deleted"
	OrderCreated      Exchange = "order-created"
	OrderUpdated      Exchange = "order-updated"
	OrderCanceled     Exchange = "order-canceled"
	ProductAddedCart  Exchange = "product-added-to-cart"
	ProductRemoveCart Exchange = "product-removed-from-cart"
)
