import { BaseError } from './baseError';

export class NotAuthorizedError extends BaseError {
  statusCode = 403;

  constructor() {
    super('Not authorized');
    Object.setPrototypeOf(this, NotAuthorizedError.prototype);
  }

  serializeErrors() {
    return [{ message: 'Oops! You are not authorized to access this route' }];
  }
}
