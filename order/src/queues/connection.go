package queues

import (
	"context"
	"fmt"
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	enums "github.com/souravdev-eng/ecom-order/src/types"
)

var Connection *amqp.Connection

func failOnError(err error, msg string) {
	if err != nil {
		log.Fatalf("%s: %s", msg, err)
	}
}

func openChannel() (*amqp.Connection, *amqp.Channel) {
	connection, err := amqp.Dial("amqp://guest:guest@localhost:5672/")
	failOnError(err, "Failed to connect to RabbitMQ")

	channel, err := connection.Channel()
	failOnError(err, "Failed to open a channel")
	fmt.Println("Order service RabitMQ server connected successfully.")
	return connection, channel
}

func QueueConnection() *amqp.Connection {
	return Connection
}

func QueuePublisher(message string, logMessage string) {
	conn, channel := openChannel()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)

	defer cancel()
	defer conn.Close()
	defer channel.Close()

	exchangeName := enums.ProductCreated
	routingKey := "order-process"

	err := channel.ExchangeDeclare(
		string(exchangeName), // name
		"direct",             // type
		true,                 // durable
		false,                // auto-deleted
		false,                // internal
		false,                // no-wait
		nil,                  // arguments
	)
	failOnError(err, "Failed to declare an exchange")
	err = channel.PublishWithContext(
		ctx,
		string(exchangeName), // exchange
		routingKey,           // routing key
		false,                // mandatory
		false,                // immediate
		amqp.Publishing{
			ContentType: "text/plain",
			Body:        []byte(message),
		},
	)
	failOnError(err, "Failed to publish a message")
	log.Println(logMessage)

}
