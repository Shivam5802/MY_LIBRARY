import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class HealthController {
  static async check(_req: Request, res: Response): Promise<void> {
    try {
      // Validate database connectivity
      await prisma.$queryRaw`SELECT 1`;

      sendSuccess(
        res,
        {
          status: 'ok',
          database: 'connected',
          timestamp: new Date().toISOString(),
        },
        200
      );
    } catch (error) {
      sendError(res, 'HEALTH_CHECK_FAILED', 'Service unhealthy: database unreachable.', 503);
    }
  }
}
