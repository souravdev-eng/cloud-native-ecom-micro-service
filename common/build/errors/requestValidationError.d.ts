import { ValidationError } from 'express-validator';
import { BaseError } from './baseError';
export declare class RequestValidationError extends BaseError {
    error: ValidationError[];
    statusCode: number;
    constructor(error: ValidationError[]);
    serializeErrors(): {
        message: any;
        field: string;
    }[];
}
