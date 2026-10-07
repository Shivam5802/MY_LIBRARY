import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BillingService } from '../services/billing.service.js';
import { PaymentService } from '../services/payment.service.js';
import { WhatsAppReminderService } from '../services/whatsapp.service.js';
import { PaymentMethod } from '../types/index.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const recordPaymentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID format.'),
  billingPeriodId: z.string().uuid('Invalid billing period ID format.'),
  amount: z.number().positive('Payment amount must be greater than zero.'),
  paymentDate: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid payment date.' })
    .optional(),
  paymentMethod: z.enum([PaymentMethod.CASH, PaymentMethod.UPI, PaymentMethod.OTHER], {
    errorMap: () => ({ message: 'Payment method must be CASH, UPI, or OTHER.' }),
  }),
  reference: z.string().trim().max(100).nullable().optional(),
  note: z.string().trim().max(255).nullable().optional(),
});

export const updatePaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than zero.').optional(),
  paymentDate: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid payment date.' })
    .optional(),
  paymentMethod: z
    .enum([PaymentMethod.CASH, PaymentMethod.UPI, PaymentMethod.OTHER])
    .optional(),
  reference: z.string().trim().max(100).nullable().optional(),
  note: z.string().trim().max(255).nullable().optional(),
});

export const updateReminderTemplateSchema = z.object({
  template: z
    .string()
    .trim()
    .min(10, 'Template must be at least 10 characters.')
    .max(500, 'Template cannot exceed 500 characters.'),
});

export class BillingController {
  static async getStudentCurrentBilling(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const studentId = req.params.id || '';
      const period = await BillingService.getCurrentBillingPeriod(studentId);
      sendSuccess(res, { billingPeriod: period }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentBillingHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const studentId = req.params.id || '';
      const history = await BillingService.getStudentBillingHistory(studentId);
      sendSuccess(res, { history }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAllBillingPeriods(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filters = {
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        shift: typeof req.query.shift === 'string' ? req.query.shift : undefined,
        locker: typeof req.query.locker === 'string' ? req.query.locker : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
      };
      const periods = await BillingService.getAllBillingPeriods(filters);
      sendSuccess(res, { periods }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getFeeReminders(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const reminders = await WhatsAppReminderService.getFeeReminders();
      sendSuccess(res, { reminders }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async recordPayment(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const payment = await PaymentService.recordPayment(req.body);
      sendSuccess(res, { payment }, 201);
    } catch (error: any) {
      sendError(res, 'PAYMENT_RECORD_ERROR', error.message || 'Failed to record payment.', 400);
    }
  }

  static async updatePayment(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const paymentId = req.params.id || '';
      const payment = await PaymentService.updatePayment(paymentId, req.body);
      sendSuccess(res, { payment }, 200);
    } catch (error: any) {
      sendError(res, 'PAYMENT_UPDATE_ERROR', error.message || 'Failed to update payment.', 400);
    }
  }

  static async getPayments(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filters = {
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        method: typeof req.query.method === 'string' ? req.query.method : undefined,
      };
      const payments = await PaymentService.getPayments(filters);
      sendSuccess(res, { payments }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async prepareWhatsAppReminder(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { studentId, billingPeriodId } = req.query;
      if (typeof studentId !== 'string' || typeof billingPeriodId !== 'string') {
        sendError(res, 'INVALID_PARAMS', 'studentId and billingPeriodId query parameters are required.', 400);
        return;
      }
      const data = await WhatsAppReminderService.prepareReminder(studentId, billingPeriodId);
      sendSuccess(res, data, 200);
    } catch (error: any) {
      sendError(res, 'WHATSAPP_PREPARE_ERROR', error.message || 'Failed to prepare reminder.', 400);
    }
  }

  static async getReminderTemplate(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const template = await WhatsAppReminderService.getReminderTemplate();
      sendSuccess(res, { template }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateReminderTemplate(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const updated = await WhatsAppReminderService.updateReminderTemplate(req.body.template);
      sendSuccess(res, { template: updated }, 200);
    } catch (error: any) {
      sendError(res, 'TEMPLATE_UPDATE_ERROR', error.message || 'Failed to update template.', 400);
    }
  }
}
