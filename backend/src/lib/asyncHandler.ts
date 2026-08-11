import { NextFunction, Request, Response } from "express";

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Wraps an async route handler so thrown errors / rejected promises
// are forwarded to Express's error middleware instead of crashing the process.
export const asyncHandler = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
