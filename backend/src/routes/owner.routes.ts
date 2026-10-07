import { Router } from 'express';
import {
  ProfileController,
  updateProfileSchema,
  changePasswordSchema,
} from '../controllers/profile.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { Role } from '../types/index.js';

export const ownerProfileRouter = Router();

// Protect owner profile routes with OWNER role
ownerProfileRouter.use(authenticate, requireRole(Role.OWNER));

ownerProfileRouter.get('/profile', ProfileController.getProfile);
ownerProfileRouter.patch('/profile', validateBody(updateProfileSchema), ProfileController.updateProfile);
ownerProfileRouter.patch('/password', validateBody(changePasswordSchema), ProfileController.changePassword);
