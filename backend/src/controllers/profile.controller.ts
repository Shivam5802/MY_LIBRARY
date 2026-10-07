import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProfileService } from '../services/profile.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').nullable().optional(),
  mobile: z.string().trim().min(10, 'Mobile must be at least 10 digits.').nullable().optional(),
  email: z.string().email('Invalid email address.').nullable().optional(),
  username: z.string().trim().min(3, 'Username must be at least 3 characters.').optional(),
  profilePhotoUrl: z.string().nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
  confirmNewPassword: z.string().min(1, 'Please confirm your new password.'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'New password and confirmation do not match.',
  path: ['confirmNewPassword'],
});

export class ProfileController {
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }
      const profile = await ProfileService.getProfile(req.user.userId);
      sendSuccess(res, { profile }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }
      const updatedProfile = await ProfileService.updateProfile(req.user.userId, req.body);
      sendSuccess(res, { profile: updatedProfile }, 200);
    } catch (error: any) {
      sendError(res, 'PROFILE_UPDATE_ERROR', error.message || 'Failed to update profile.', 400);
    }
  }

  static async changePassword(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }
      const { currentPassword, newPassword } = req.body;
      await ProfileService.changePassword(req.user.userId, currentPassword, newPassword);
      sendSuccess(res, { message: 'Password changed successfully.' }, 200);
    } catch (error: any) {
      sendError(res, 'PASSWORD_CHANGE_ERROR', error.message || 'Failed to change password.', 400);
    }
  }
}
