import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import { Role, JwtPayload } from '../types/index.js';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'UNAUTHORIZED', 'Authentication token required.', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    sendError(res, 'UNAUTHORIZED', 'Authentication token is missing.', 401);
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    sendError(res, 'INVALID_TOKEN', 'Token is invalid or expired.', 401);
  }
};

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        'FORBIDDEN',
        'You do not have permission to access this resource.',
        403
      );
      return;
    }

    next();
  };
};
