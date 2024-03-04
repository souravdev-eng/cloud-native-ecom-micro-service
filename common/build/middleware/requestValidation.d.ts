import { NextFunction, Request, Response } from 'express';
export declare const requestValidation: (req: Request, res: Response, next: NextFunction) => Promise<void>;
