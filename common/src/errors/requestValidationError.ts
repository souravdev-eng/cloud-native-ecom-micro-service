import { ValidationError } from 'express-validator';
import { BaseError } from './baseError';

export class RequestValidationError extends BaseError {
  statusCode = 400;

  constructor(public error: ValidationError[]) {
    super('Request validation error');
    Object.setPrototypeOf(this, RequestValidationError.prototype);
  }

  serializeErrors() {
    return this.error.map((err) => {
      return { message: err.msg, field: err.param };
    });
  }
}
