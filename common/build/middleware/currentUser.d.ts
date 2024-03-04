import { NextFunction, Request, Response } from 'express';
type UserPayload = {
    id: string;
    email: string;
    role: string;
};
declare global {
    namespace Express {
        interface Request {
            user: UserPayload;
        }
    }
}
export declare const currentUser: (req: Request, res: Response, next: NextFunction) => void;
export {};
