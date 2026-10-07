import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Centralized logging for backend diagnostics
  console.error('[Unhandled Error]:', err.name, err.message);

  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    sendError(res, 'MALFORMED_JSON', 'Malformed JSON in request body.', 400);
    return;
  }

  // Hide internal stack traces and error details in responses
  sendError(
    res,
    'INTERNAL_SERVER_ERROR',
    'An unexpected internal server error occurred.',
    500
  );
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(
    res,
    'NOT_FOUND',
    `Resource not found: ${req.method} ${req.originalUrl}`,
    404
  );
};
