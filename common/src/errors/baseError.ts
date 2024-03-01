export abstract class BaseError extends Error {
  abstract statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  abstract serializeErrors(): { message: string; field?: string }[];
}
