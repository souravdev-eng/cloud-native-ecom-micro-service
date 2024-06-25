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
exports.BaseListener = void 0;
class BaseListener {
    constructor(channel) {
        this.channel = channel;
    }
    listen() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.channel.assertExchange(this.exchangeName, 'direct');
            const consumeQueue = yield this.channel.assertQueue(this.routingKey);
            yield this.channel.bindQueue(consumeQueue.queue, this.exchangeName, this.routingKey);
            this.channel.consume(consumeQueue.queue, (msg) => __awaiter(this, void 0, void 0, function* () {
                console.log(`Message received: ${this.exchangeName} / ${this.routingKey}`);
                if (msg) {
                    const parsedData = JSON.parse(msg.content.toString());
                    this.onMessage(parsedData, this.channel, msg);
                }
            }));
        });
    }
}
exports.BaseListener = BaseListener;
