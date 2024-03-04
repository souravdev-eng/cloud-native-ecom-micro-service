"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotAuthorizedError = void 0;
const baseError_1 = require("./baseError");
class NotAuthorizedError extends baseError_1.BaseError {
    constructor() {
        super('Not authorized');
        this.statusCode = 403;
        Object.setPrototypeOf(this, NotAuthorizedError.prototype);
    }
    serializeErrors() {
        return [{ message: 'Oops! You are not authorized to access this route' }];
    }
}
exports.NotAuthorizedError = NotAuthorizedError;
