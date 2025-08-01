package configs

import (
	"fmt"
	"log"
	"os"

	amqp "github.com/rabbitmq/amqp091-go"
)

func ConnectAMPQClient() {
	uri := os.Getenv("RABBITMQ_ENDPOINT")

	if uri == "" {
		log.Fatal("You must set your 'RABBITMQ_ENDPOINT' environment variable")
	}

	conn, err := amqp.Dial(uri)

	if err != nil {
		log.Panic(err.Error())
	}

	fmt.Println("RabbitMQ connected successfully")

	defer conn.Close()
}
