"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MQConsumer = void 0;
class MQConsumer {
    constructor(channel) {
        this.channel = channel;
    }
    consume() {
        return __awaiter(this, void 0, void 0, function* () {
            this.channel.assertExchange(this.exchangeName, 'direct');
            // `assertQueue` will check if there is a queue exist or not to listen the messages
            // if present then it will not create again
            // if not then it will create a queue with provided name
            const ecomQueue = yield this.channel.assertQueue(this.queueName, {
                durable: true,
                autoDelete: false,
            });
            yield this.channel.bindQueue(ecomQueue.queue, this.exchangeName, this.routingKey);
            this.channel.consume(ecomQueue.queue, (msg) => __awaiter(this, void 0, void 0, function* () {
                console.log(`Message received: ${this.exchangeName} / ${this.queueName}`);
                if (msg) {
                    const parsedData = JSON.parse(msg.content.toString());
                    this.onMessage(parsedData, msg);
                }
            }));
        });
    }
}
exports.MQConsumer = MQConsumer;
