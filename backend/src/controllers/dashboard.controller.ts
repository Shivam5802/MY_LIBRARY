import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/response.js';

export class DashboardController {
  static async getOwnerDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await DashboardService.getOwnerStats();
      sendSuccess(res, { stats }, 200);
    } catch (error) {
      next(error);
    }
  }
}
