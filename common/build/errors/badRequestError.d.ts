import { BaseError } from './baseError';
export declare class BadRequestError extends BaseError {
    statusCode: number;
    constructor(message: string);
    serializeErrors(): {
        message: string;
    }[];
}
