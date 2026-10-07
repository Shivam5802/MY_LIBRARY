import { Router } from 'express';
import {
  BillingController,
  recordPaymentSchema,
  updatePaymentSchema,
  updateReminderTemplateSchema,
} from '../controllers/billing.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { Role } from '../types/index.js';

export const billingRouter = Router();

// Enforce authentication and OWNER role for operational billing
billingRouter.use(authenticate, requireRole(Role.OWNER));

// Billing Periods
billingRouter.get('/periods', BillingController.getAllBillingPeriods);
billingRouter.get('/students/:id/current', BillingController.getStudentCurrentBilling);
billingRouter.get('/students/:id/history', BillingController.getStudentBillingHistory);

// Payments
billingRouter.get('/payments', BillingController.getPayments);
billingRouter.post('/payments', validateBody(recordPaymentSchema), BillingController.recordPayment);
billingRouter.patch('/payments/:id', validateBody(updatePaymentSchema), BillingController.updatePayment);

// Reminders & WhatsApp
billingRouter.get('/reminders', BillingController.getFeeReminders);
billingRouter.get('/whatsapp/prepare', BillingController.prepareWhatsAppReminder);
billingRouter.get('/settings/reminder-template', BillingController.getReminderTemplate);
billingRouter.patch(
  '/settings/reminder-template',
  validateBody(updateReminderTemplateSchema),
  BillingController.updateReminderTemplate
);
