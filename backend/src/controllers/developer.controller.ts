import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { IncomeReportService } from '../services/income-report.service.js';
import { ReportsService } from '../services/reports.service.js';
import { ActivityLogService } from '../services/activity-log.service.js';
import { DataIntegrityService } from '../services/data-integrity.service.js';
import { ExportService } from '../services/export.service.js';
import { ProfileService } from '../services/profile.service.js';
import { TimezoneUtils } from '../utils/timezone.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class DeveloperController {
  /**
   * GET /api/v1/developer/dashboard
   */
  static async getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await IncomeReportService.getDeveloperDashboardStats();
      sendSuccess(res, { stats }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/developer/income
   */
  static async getIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        preset: typeof req.query.preset === 'string' ? req.query.preset : undefined,
        startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
        endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
        method: typeof req.query.method === 'string' ? req.query.method : undefined,
        shift: typeof req.query.shift === 'string' ? req.query.shift : undefined,
        locker: typeof req.query.locker === 'string' ? req.query.locker : undefined,
        interval: req.query.interval as any,
      };

      const overview = await IncomeReportService.getIncomeOverview(filters);
      sendSuccess(res, overview, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/developer/payments/:id
   */
  static async getPaymentDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paymentId = req.params.id;
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          student: {
            include: {
              assignments: { where: { isCurrent: true }, include: { seat: true } },
            },
          },
          billingPeriod: true,
        },
      });

      if (!payment) {
        sendError(res, 'NOT_FOUND', 'Payment record not found.', 404);
        return;
      }

      const currentSeat = payment.student.assignments.find((a) => a.isCurrent);
      const pStart = TimezoneUtils.formatToIstDisplay(payment.billingPeriod.periodStart);
      const pEnd = TimezoneUtils.formatToIstDisplay(payment.billingPeriod.periodEnd);

      const detail = {
        id: payment.id,
        receiptNumber: payment.receiptNumber,
        studentId: payment.studentId,
        studentName: payment.student.name,
        studentMobile: payment.student.mobile,
        seatNumber: currentSeat?.seat?.seatNumber ?? null,
        billingPeriodId: payment.billingPeriodId,
        billingPeriod: `${pStart} - ${pEnd}`,
        amount: Number(payment.amount),
        paymentDate: payment.paymentDate.toISOString(),
        paymentMethod: payment.paymentMethod,
        reference: payment.reference,
        note: payment.note,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
      };

      sendSuccess(res, { payment: detail }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/developer/reports/:category
   */
  static async getReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.params.category;
      const filters = {
        preset: typeof req.query.preset === 'string' ? req.query.preset : undefined,
        startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
        endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
        shift: req.query.shift as any,
        locker: req.query.locker as any,
        paymentMethod: req.query.paymentMethod as any,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        year: req.query.year ? parseInt(req.query.year as string, 10) : undefined,
      };

      switch (category) {
        case 'income': {
          const data = await ReportsService.getIncomeReport(filters);
          sendSuccess(res, data, 200);
          return;
        }
        case 'pending-fees': {
          const data = await ReportsService.getPendingFeeReport(filters);
          sendSuccess(res, data, 200);
          return;
        }
        case 'students': {
          const data = await ReportsService.getStudentReport(filters);
          sendSuccess(res, data, 200);
          return;
        }
        case 'seats': {
          const data = await ReportsService.getSeatOccupancyReport();
          sendSuccess(res, data, 200);
          return;
        }
        case 'admissions': {
          const data = await ReportsService.getAdmissionsReport(filters);
          sendSuccess(res, data, 200);
          return;
        }
        case 'shift': {
          const data = await ReportsService.getShiftReport();
          sendSuccess(res, data, 200);
          return;
        }
        case 'locker': {
          const data = await ReportsService.getLockerReport();
          sendSuccess(res, data, 200);
          return;
        }
        case 'monthly-summary': {
          const data = await ReportsService.getMonthlySummary(filters.year);
          sendSuccess(res, data, 200);
          return;
        }
        default:
          sendError(res, 'INVALID_REPORT', `Unknown report category: ${category}`, 400);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/developer/activity
   */
  static async getActivityLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        userId: typeof req.query.userId === 'string' ? req.query.userId : undefined,
        role: req.query.role as any,
        action: typeof req.query.action === 'string' ? req.query.action : undefined,
        entityType: typeof req.query.entityType === 'string' ? req.query.entityType : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
        endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
      };

      const result = await ActivityLogService.getLogs(filters);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/developer/system
   */
  static async getSystemInfo(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTimeMs = Date.now() - startTime;

      const [
        totalSeats,
        occupiedSeats,
        activeStudents,
        archivedStudents,
        paymentRecords,
        billingPeriods,
        activityLogs,
      ] = await Promise.all([
        prisma.seat.count(),
        prisma.seat.count({ where: { status: 'OCCUPIED' } }),
        prisma.student.count({ where: { status: 'ACTIVE' } }),
        prisma.student.count({ where: { status: 'ARCHIVED' } }),
        prisma.payment.count(),
        prisma.billingPeriod.count(),
        prisma.activityLog.count(),
      ]);

      const systemData = {
        application: 'MY LIBRARY',
        environment: process.env.NODE_ENV || 'development',
        database: {
          status: 'Connected',
          responseTimeMs,
        },
        backend: {
          status: 'Healthy',
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
        },
        counts: {
          totalSeats,
          occupiedSeats,
          activeStudents,
          archivedStudents,
          paymentRecords,
          billingPeriods,
          activityLogs,
        },
        timezone: 'Asia/Kolkata',
        lastChecked: new Date().toISOString(),
      };

      sendSuccess(res, { system: systemData }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/developer/system/integrity
   */
  static async getIntegrityCheck(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await DataIntegrityService.runIntegrityCheck();
      sendSuccess(res, { report }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/developer/profile
   */
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

  /**
   * PATCH /api/v1/developer/profile
   */
  static async updateProfile(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }
      // Never allow changing roles
      delete req.body.role;

      const profile = await ProfileService.updateProfile(req.user.userId, req.body);

      // Audit log developer profile update
      await ActivityLogService.log({
        action: 'DEVELOPER_PROFILE_UPDATED',
        userId: req.user.userId,
        entityType: 'User',
        entityId: req.user.userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      sendSuccess(res, { profile }, 200);
    } catch (error: any) {
      sendError(res, 'PROFILE_UPDATE_ERROR', error.message || 'Failed to update profile.', 400);
    }
  }

  /**
   * PATCH /api/v1/developer/password
   */
  static async changePassword(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }
      const { currentPassword, newPassword } = req.body;
      await ProfileService.changePassword(req.user.userId, currentPassword, newPassword);

      // Audit log password update
      await ActivityLogService.log({
        action: 'PASSWORD_CHANGED',
        userId: req.user.userId,
        entityType: 'User',
        entityId: req.user.userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      sendSuccess(res, { message: 'Password changed successfully.' }, 200);
    } catch (error: any) {
      sendError(res, 'PASSWORD_CHANGE_ERROR', error.message || 'Failed to change password.', 400);
    }
  }

  /**
   * GET /api/v1/developer/reports/:category/export
   * Query params: ?format=csv|xlsx|pdf & filters...
   */
  static async exportReport(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const category = req.params.category;
      const format = (req.query.format as string || 'csv').toLowerCase();

      const filters = {
        preset: typeof req.query.preset === 'string' ? req.query.preset : undefined,
        startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
        endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
        shift: req.query.shift as any,
        locker: req.query.locker as any,
        paymentMethod: req.query.paymentMethod as any,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        year: req.query.year ? parseInt(req.query.year as string, 10) : undefined,
      };

      let headers: string[] = [];
      let rows: (string | number | null | undefined)[][] = [];
      let summaryRows: { label: string; value: string | number }[] = [];
      let reportTitle = 'Report';

      if (category === 'income' || category === 'payments') {
        reportTitle = 'Income & Payments Report';
        const data = await ReportsService.getIncomeReport(filters);
        headers = [
          'Receipt #',
          'Payment Date',
          'Student',
          'Seat',
          'Shift',
          'Locker',
          'Billing Period',
          'Amount (INR)',
          'Method',
          'Reference',
        ];
        rows = data.rows.map((r) => [
          r.receiptNumber,
          TimezoneUtils.formatToIstDisplay(r.paymentDate),
          r.studentName,
          r.seatNumber ? `#${r.seatNumber}` : 'Unassigned',
          r.shift,
          r.locker,
          r.billingPeriod,
          r.amount,
          r.paymentMethod,
          r.reference || '-',
        ]);
        summaryRows = [
          { label: 'Total Recorded Payments', value: data.totalPayments },
          { label: 'Total Collected Income (INR)', value: `INR ${data.totalIncome.toLocaleString('en-IN')}` },
        ];
      } else if (category === 'pending-fees') {
        reportTitle = 'Pending Fees Report';
        const data = await ReportsService.getPendingFeeReport(filters);
        headers = [
          'Student',
          'Seat',
          'Mobile',
          'Billing Period',
          'Fee Amount',
          'Paid',
          'Outstanding (INR)',
          'Due Date',
          'Status',
          'Days Overdue',
        ];
        rows = data.rows.map((r) => [
          r.studentName,
          r.seatNumber ? `#${r.seatNumber}` : 'Unassigned',
          r.mobile,
          r.billingPeriod,
          r.amount,
          r.paid,
          r.outstanding,
          TimezoneUtils.formatToIstDisplay(r.dueDate),
          r.status,
          r.daysOverdue,
        ]);
        summaryRows = [
          { label: 'Students with Outstanding Dues', value: data.studentsWithOutstanding },
          { label: 'Total Outstanding Balance (INR)', value: `INR ${data.totalOutstanding.toLocaleString('en-IN')}` },
        ];
      } else if (category === 'students') {
        reportTitle = 'Student Directory Report';
        const data = await ReportsService.getStudentReport(filters);
        headers = [
          'Student Name',
          'Seat',
          'Mobile',
          'Shift',
          'Locker',
          'Admission Date',
          'Fee Cycle Start Date',
          'Monthly Fee (INR)',
          'Status',
        ];
        rows = data.rows.map((r) => [
          r.name,
          r.seatNumber ? `#${r.seatNumber}` : 'None',
          r.mobile,
          r.shift,
          r.locker,
          TimezoneUtils.formatToIstDisplay(r.admissionDate),
          TimezoneUtils.formatToIstDisplay(r.feeCycleStartDate),
          r.monthlyFee,
          r.status,
        ]);
        summaryRows = [{ label: 'Total Students', value: data.totalCount }];
      } else if (category === 'seats') {
        reportTitle = 'Seat Occupancy Report';
        const data = await ReportsService.getSeatOccupancyReport();
        headers = ['Seat #', 'Status', 'Current Student', 'Mobile', 'Assigned Date'];
        rows = data.rows.map((r) => [
          `Seat #${r.seatNumber}`,
          r.status,
          r.studentName || '-',
          r.studentMobile || '-',
          r.assignedDate ? TimezoneUtils.formatToIstDisplay(r.assignedDate) : '-',
        ]);
        summaryRows = [
          { label: 'Total Seats', value: data.totalSeats },
          { label: 'Occupied Seats', value: data.occupiedSeats },
          { label: 'Available Seats', value: data.availableSeats },
          { label: 'Occupancy Rate', value: `${data.occupancyPercentage}%` },
        ];
      } else if (category === 'monthly-summary') {
        reportTitle = `Monthly Financial Summary (${filters.year || new Date().getFullYear()})`;
        const data = await ReportsService.getMonthlySummary(filters.year);
        headers = [
          'Month',
          'Collected Income (INR)',
          'Payment Count',
          'Pending Amount (INR)',
          'Active Students',
          'New Admissions',
        ];
        rows = data.rows.map((r) => [
          r.month,
          r.collectedIncome,
          r.paymentCount,
          r.pendingAmount,
          r.activeStudents,
          r.newAdmissions,
        ]);
        const sumIncome = data.rows.reduce((s, r) => s + r.collectedIncome, 0);
        summaryRows = [
          { label: 'Annual Collected Income', value: `INR ${sumIncome.toLocaleString('en-IN')}` },
        ];
      } else {
        sendError(res, 'INVALID_REPORT', `Unknown export category: ${category}`, 400);
        return;
      }

      const timestampStr = new Date().toISOString().slice(0, 10);
      const filenameBase = `${category}_report_${timestampStr}`;

      if (format === 'csv') {
        const summaryTuples = summaryRows.map((s) => [s.label, s.value]);
        const csv = ExportService.generateCsv(headers, rows, summaryTuples);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);
        res.send(csv);
        return;
      }

      if (format === 'xlsx') {
        const buffer = await ExportService.generateExcel({
          sheetName: category.toUpperCase(),
          reportTitle,
          headers,
          rows,
          summaryRows,
        });
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.xlsx"`);
        res.send(buffer);
        return;
      }

      if (format === 'pdf') {
        const buffer = await ExportService.generatePdf({
          reportTitle,
          headers,
          rows,
          summary: summaryRows,
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.pdf"`);
        res.send(buffer);
        return;
      }

      sendError(res, 'UNSUPPORTED_FORMAT', 'Supported formats are csv, xlsx, or pdf.', 400);
    } catch (error: any) {
      sendError(res, 'EXPORT_ERROR', error.message || 'Unable to generate export report.', 500);
    }
  }
}
