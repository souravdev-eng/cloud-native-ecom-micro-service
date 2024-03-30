"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.winstonLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_elasticsearch_1 = require("winston-elasticsearch");
const eTransformer = (logData) => {
    return (0, winston_elasticsearch_1.ElasticsearchTransformer)(logData);
};
const winstonLogger = (elasticSearchNode, name, level) => {
    const options = {
        console: {
            level,
            handleException: true,
            json: false,
            colorize: true,
        },
        elasticsearch: {
            level,
            transformer: eTransformer,
            clientOpts: {
                node: elasticSearchNode,
                log: level,
                maxRetries: 2,
                requestTimeout: 1000,
                sniffOnStart: false,
            },
        },
    };
    const esTransport = new winston_elasticsearch_1.ElasticsearchTransport(options.elasticsearch);
    const logger = winston_1.default.createLogger({
        exitOnError: false,
        defaultMeta: { service: name },
        transports: [new winston_1.default.transports.Console(options.console), esTransport],
    });
    return logger;
};
exports.winstonLogger = winstonLogger;
