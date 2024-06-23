package models

type Review struct {
	Id         int    `json:"id" gorm:"primaryKey"`
	ReviewText string `json:"review_text"`
	Rating     int    `json:"rating"`
}
