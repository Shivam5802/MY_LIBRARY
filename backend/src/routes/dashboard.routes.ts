import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { Role } from '../types/index.js';

export const dashboardRouter = Router();

// Protect owner dashboard route with OWNER role
dashboardRouter.get('/owner', authenticate, requireRole(Role.OWNER), DashboardController.getOwnerDashboard);
