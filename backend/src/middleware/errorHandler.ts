import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { ApiError } from "../lib/errors";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Express recognizes this as an error handler purely by arity (4 params) - keep all 4.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      error: "Validation failed",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: `Duplicate value for unique field(s): ${(err.meta?.target as string[])?.join(", ")}`,
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Record not found" });
    }
    return res.status(400).json({ error: "Database request error", code: err.code });
  }

  console.error("Unhandled error:", err);
  const message = err instanceof Error ? err.message : "Internal server error";
  return res.status(500).json({ error: message });
}
