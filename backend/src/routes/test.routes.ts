import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { Role } from '../types/index.js';
import { sendSuccess } from '../utils/response.js';

export const protectedTestRouter = Router();

// Test endpoint accessible by any authenticated user (OWNER or DEVELOPER)
protectedTestRouter.get('/protected', authenticate, (req: Request, res: Response) => {
  sendSuccess(res, {
    message: 'Authenticated route accessed successfully.',
    user: req.user,
  });
});

// Test endpoint accessible ONLY by OWNER
protectedTestRouter.get('/owner-only', authenticate, requireRole(Role.OWNER), (req: Request, res: Response) => {
  sendSuccess(res, {
    message: 'Owner-only route accessed successfully.',
    user: req.user,
  });
});

// Test endpoint accessible ONLY by DEVELOPER
protectedTestRouter.get(
  '/developer-only',
  authenticate,
  requireRole(Role.DEVELOPER),
  (req: Request, res: Response) => {
    sendSuccess(res, {
      message: 'Developer-only route accessed successfully.',
      user: req.user,
    });
  }
);
