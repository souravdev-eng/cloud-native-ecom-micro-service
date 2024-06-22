package db

import (
	"log"

	"github.com/souravdev-eng/cn-review-service/src/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() *gorm.DB {
	dbUrl := "postgres://rimgaamk:nT2FGPAA7fpwusx7s98zWVFtpTbXtm-r@tiny.db.elephantsql.com/rimgaamk"

	db, err := gorm.Open(postgres.Open(dbUrl), &gorm.Config{})

	if err != nil {
		log.Fatalln(err)
	}

	db.AutoMigrate(&models.Review{})

	return db
}
