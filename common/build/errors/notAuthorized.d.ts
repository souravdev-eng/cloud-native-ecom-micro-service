import { BaseError } from './baseError';
export declare class NotAuthorizedError extends BaseError {
    statusCode: number;
    constructor();
    serializeErrors(): {
        message: string;
    }[];
}
