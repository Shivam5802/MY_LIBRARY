import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

import { ActivityLogService } from '../services/activity-log.service.js';

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);

      if (!result) {
        // Record safe failed login attempt (never storing plaintext password)
        await ActivityLogService.log({
          action: 'LOGIN_FAILED',
          entityType: 'User',
          metadata: { attemptedUsername: username },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });

        // Generic error message to prevent username enumeration
        sendError(res, 'INVALID_CREDENTIALS', 'Invalid username or password.', 401);
        return;
      }

      // Record successful login
      await ActivityLogService.log({
        action: 'LOGIN',
        userId: result.user.id,
        entityType: 'User',
        entityId: result.user.id,
        metadata: { username: result.user.username, role: result.user.role },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }

      const user = await AuthService.getCurrentUser(req.user.userId);
      if (!user) {
        sendError(res, 'USER_NOT_FOUND', 'User no longer exists.', 404);
        return;
      }

      sendSuccess(res, { user }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    // Stateless JWT logout acknowledging client token discard
    sendSuccess(res, { message: 'Logged out successfully.' }, 200);
  }
}
