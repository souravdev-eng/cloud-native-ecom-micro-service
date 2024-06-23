package models

type Product struct {
	Id     int    `json:"id" gorm:"primaryKey"`
	Title  string `json:"title"`
	Seller string `json:"sellerID"`
}
