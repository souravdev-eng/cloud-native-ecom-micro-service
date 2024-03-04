import { NextFunction, Request, Response } from 'express';
export declare const restrictTo: (...roles: any) => (req: Request, res: Response, next: NextFunction) => void;
