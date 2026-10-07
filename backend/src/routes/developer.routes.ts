import { Router } from 'express';
import { DeveloperController } from '../controllers/developer.controller.js';
import { updateProfileSchema, changePasswordSchema } from '../controllers/profile.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { Role } from '../types/index.js';

export const developerRouter = Router();

// Mandatory Authentication and DEVELOPER Role Guard on ALL developer routes
// OWNER role will receive HTTP 403 Forbidden
developerRouter.use(authenticate, requireRole(Role.DEVELOPER));

// High-level Dashboard Analytics
developerRouter.get('/dashboard', DeveloperController.getDashboard);

// Income Analytics & Trends
developerRouter.get('/income', DeveloperController.getIncome);
developerRouter.get('/payments/:id', DeveloperController.getPaymentDetail);

// Advanced Reports & Filtering
developerRouter.get('/reports/:category/export', DeveloperController.exportReport);
developerRouter.get('/reports/:category', DeveloperController.getReport);

// System Activity Logs
developerRouter.get('/activity', DeveloperController.getActivityLogs);

// System Health & Diagnostics
developerRouter.get('/system', DeveloperController.getSystemInfo);
developerRouter.get('/system/integrity', DeveloperController.getIntegrityCheck);

// Developer Profile & Security Management
developerRouter.get('/profile', DeveloperController.getProfile);
developerRouter.patch('/profile', validateBody(updateProfileSchema), DeveloperController.updateProfile);
developerRouter.patch('/password', validateBody(changePasswordSchema), DeveloperController.changePassword);
