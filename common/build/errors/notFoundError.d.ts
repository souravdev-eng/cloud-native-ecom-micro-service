import { BaseError } from './baseError';
export declare class NotFoundError extends BaseError {
    message: string;
    statusCode: number;
    constructor(message: string);
    serializeErrors(): {
        message: string;
    }[];
}
