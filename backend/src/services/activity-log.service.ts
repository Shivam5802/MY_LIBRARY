import { prisma } from '../config/prisma.js';
import { Role } from '../types/index.js';

export interface LogActivityParams {
  action: string;
  userId?: string | null;
  studentId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface ActivityLogFilters {
  userId?: string;
  role?: Role;
  action?: string;
  entityType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export class ActivityLogService {
  /**
   * Safe asynchronous logger that prevents password or sensitive key storage.
   */
  static async log(params: LogActivityParams): Promise<void> {
    try {
      let sanitizedMetadata: string | null = null;
      if (params.metadata) {
        // Clone and sanitize sensitive fields
        const safeObj = { ...params.metadata };
        delete safeObj.password;
        delete safeObj.currentPassword;
        delete safeObj.newPassword;
        delete safeObj.confirmNewPassword;
        delete safeObj.passwordHash;
        delete safeObj.token;
        delete safeObj.jwt;
        delete safeObj.secret;
        sanitizedMetadata = JSON.stringify(safeObj);
      }

      await prisma.activityLog.create({
        data: {
          action: params.action,
          userId: params.userId || null,
          studentId: params.studentId || null,
          entityType: params.entityType || null,
          entityId: params.entityId || null,
          metadata: sanitizedMetadata,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
      });
    } catch (err) {
      // Don't crash main application transaction on audit logging failure
      console.error('Failed to record activity log:', err);
    }
  }

  /**
   * Retrieves activity logs with filters, search, and pagination.
   */
  static async getLogs(filters: ActivityLogFilters = {}) {
    const limit = Math.min(Math.max(Number(filters.limit) || 50, 1), 200);
    const offset = Math.max(Number(filters.offset) || 0, 0);

    const where: any = {};

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.role) {
      where.user = { role: filters.role };
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { action: { contains: q, mode: 'insensitive' } },
        { entityId: { contains: q, mode: 'insensitive' } },
        { metadata: { contains: q, mode: 'insensitive' } },
        { user: { username: { contains: q, mode: 'insensitive' } } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              role: true,
            },
          },
        },
      }),
    ]);

    // Fetch student names where studentId is present
    const studentIds = Array.from(
      new Set(logs.map((l) => l.studentId).filter((id): id is string => Boolean(id)))
    );

    const students = studentIds.length > 0
      ? await prisma.student.findMany({
          where: { id: { in: studentIds } },
          select: { id: true, name: true },
        })
      : [];

    const studentMap = new Map(students.map((s) => [s.id, s.name]));

    const mapped = logs.map((log) => {
      let parsedMeta: any = null;
      if (log.metadata) {
        try {
          parsedMeta = JSON.parse(log.metadata);
        } catch {
          parsedMeta = log.metadata;
        }
      }

      return {
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        userId: log.userId,
        username: log.user?.username || null,
        userRole: (log.user?.role as Role) || null,
        userName: log.user?.name || null,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        studentId: log.studentId,
        studentName: log.studentId ? studentMap.get(log.studentId) || null : null,
        metadata: parsedMeta,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      };
    });

    return {
      total,
      limit,
      offset,
      logs: mapped,
    };
  }
}
