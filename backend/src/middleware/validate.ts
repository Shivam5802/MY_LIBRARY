import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response.js';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formattedErrors = (result.error as ZodError).issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      sendError(res, 'VALIDATION_ERROR', 'Invalid request data.', 400, formattedErrors);
      return;
    }
    req.body = result.data;
    next();
  };
};
