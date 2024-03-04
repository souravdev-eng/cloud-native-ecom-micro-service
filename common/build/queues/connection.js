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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueConnection = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
class QueueConnection {
    constructor(endPoint) {
        this.endPoint = endPoint;
        this.connection = undefined;
        this.channel = undefined;
    }
    createConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.connection = yield amqplib_1.default.connect(this.endPoint);
                this.channel = yield this.connection.createChannel();
                this.closeConnection();
                console.log('Notification server connected to queue successfully...');
                return this.channel;
            }
            catch (error) {
                console.log('error', 'NotificationService error createConnection() method:', error);
                return undefined;
            }
        });
    }
    closeConnection() {
        process.once('SIGINT', () => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (this.connection) {
                yield ((_a = this.connection) === null || _a === void 0 ? void 0 : _a.close());
            }
            if (this.channel) {
                yield ((_b = this.channel) === null || _b === void 0 ? void 0 : _b.close());
            }
        }));
    }
}
exports.QueueConnection = QueueConnection;
