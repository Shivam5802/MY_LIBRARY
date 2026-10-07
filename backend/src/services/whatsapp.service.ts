import { prisma } from '../config/prisma.js';
import { BillingService } from './billing.service.js';
import { FeeReminderItem, UserFacingFeeStatus } from '../types/index.js';

export const DEFAULT_FEE_REMINDER_MESSAGE =
  'Hello {name}, your MY LIBRARY fee of ₹{amount} is due on {dueDate}. Please complete your payment on time. Thank you.';

export class WhatsAppReminderService {
  /**
   * Normalizes Indian or international phone numbers safely.
   * If 10-digit number (e.g. 9876543210), formats to +919876543210.
   * If already has + or country code, cleans whitespace and preserves country code.
   */
  static normalizePhoneNumber(phoneInput: string): string {
    const cleaned = phoneInput.replace(/[\s\-()]/g, '');
    if (/^[6-9]\d{9}$/.test(cleaned)) {
      return `+91${cleaned}`;
    }
    if (/^\+?\d{10,15}$/.test(cleaned)) {
      return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Fetches the current customizable fee reminder message template from system settings.
   */
  static async getReminderTemplate(): Promise<string> {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'FEE_REMINDER_MESSAGE' },
    });
    return setting?.value || DEFAULT_FEE_REMINDER_MESSAGE;
  }

  /**
   * Updates customizable fee reminder message template.
   */
  static async updateReminderTemplate(newMessage: string): Promise<string> {
    const trimmed = newMessage.trim();
    if (!trimmed) {
      throw new Error('Reminder message template cannot be empty.');
    }
    if (trimmed.length > 500) {
      throw new Error('Reminder message template cannot exceed 500 characters.');
    }

    const updated = await prisma.systemSetting.upsert({
      where: { key: 'FEE_REMINDER_MESSAGE' },
      update: { value: trimmed },
      create: {
        key: 'FEE_REMINDER_MESSAGE',
        value: trimmed,
        description: 'Template for WhatsApp student fee reminders',
      },
    });

    return updated.value;
  }

  /**
   * Formats message with dynamic tokens: {name}, {amount}, {dueDate}, {seat}, {libraryName}
   */
  static formatMessage(
    template: string,
    vars: {
      name: string;
      amount: number;
      dueDate: string;
      seatNumber?: number | null;
      libraryName?: string;
    }
  ): string {
    const seatDisplay = vars.seatNumber ? `Seat #${vars.seatNumber}` : 'Seat Unassigned';
    const libName = vars.libraryName || 'MY LIBRARY';

    return template
      .replace(/{name}/g, vars.name)
      .replace(/{amount}/g, vars.amount.toLocaleString('en-IN'))
      .replace(/{dueDate}/g, vars.dueDate)
      .replace(/{seat}/g, seatDisplay)
      .replace(/{libraryName}/g, libName);
  }

  /**
   * Generates WhatsApp Click-to-Chat URL
   */
  static generateWhatsAppClickToChatUrl(phone: string, message: string): string {
    const normalized = this.normalizePhoneNumber(phone).replace(/^\+/, '');
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${normalized}?text=${encoded}`;
  }

  /**
   * Retrieves active students who have fees due soon (<= 5 days) or overdue.
   */
  static async getFeeReminders(referenceDate: Date = new Date()): Promise<FeeReminderItem[]> {
    // 1. Fetch all active billing periods
    const allPeriods = await BillingService.getAllBillingPeriods({}, referenceDate);

    // 2. Filter for those requiring reminders (DUE_SOON, DUE, OVERDUE) and belonging to ACTIVE students
    const reminders: FeeReminderItem[] = [];

    for (const p of allPeriods) {
      if (!p.student) continue;

      if (
        p.status === UserFacingFeeStatus.DUE_SOON ||
        p.status === UserFacingFeeStatus.DUE ||
        p.status === UserFacingFeeStatus.OVERDUE
      ) {
        reminders.push({
          studentId: p.student.id,
          studentName: p.student.name,
          mobile: p.student.mobile,
          seatNumber: p.student.seatNumber ?? null,
          billingPeriodId: p.id,
          amount: p.amount,
          paidAmount: p.paidAmount,
          outstanding: p.outstanding,
          dueDate: p.dueDate,
          daysRemaining: p.daysRemaining,
          status: p.status,
        });
      }
    }

    // Sort by daysRemaining ascending (most urgent first)
    reminders.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return reminders;
  }

  /**
   * Prepares WhatsApp reminder payload (personalized message and click-to-chat URL)
   */
  static async prepareReminder(
    studentId: string,
    billingPeriodId: string
  ): Promise<{
    studentName: string;
    mobile: string;
    normalizedMobile: string;
    formattedMessage: string;
    whatsappUrl: string;
  }> {
    const period = await prisma.billingPeriod.findUnique({
      where: { id: billingPeriodId },
      include: {
        payments: true,
        student: {
          include: {
            assignments: { where: { isCurrent: true }, include: { seat: true } },
          },
        },
      },
    });

    if (!period || period.studentId !== studentId) {
      throw new Error('Billing period or student not found.');
    }

    const template = await this.getReminderTemplate();
    const currentSeat = period.student.assignments.find((a) => a.isCurrent);
    const seatNumber = currentSeat?.seat?.seatNumber ?? null;

    const totalPaid = period.payments.reduce((s, p) => s + Number(p.amount), 0);
    const outstanding = Math.max(0, Number(period.amount) - totalPaid);

    // Format dueDate into Indian locale string: e.g. "11 Oct 2026"
    const dueDateStr = new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    }).format(period.periodEnd);

    const formattedMessage = this.formatMessage(template, {
      name: period.student.name,
      amount: outstanding,
      dueDate: dueDateStr,
      seatNumber,
    });

    const normalizedMobile = this.normalizePhoneNumber(period.student.mobile);
    const whatsappUrl = this.generateWhatsAppClickToChatUrl(
      normalizedMobile,
      formattedMessage
    );

    // Log initiation event
    await prisma.activityLog.create({
      data: {
        action: 'WHATSAPP_REMINDER_INITIATED',
        studentId: period.student.id,
        metadata: JSON.stringify({
          billingPeriodId: period.id,
          outstanding,
          dueDate: period.periodEnd.toISOString(),
        }),
      },
    });

    return {
      studentName: period.student.name,
      mobile: period.student.mobile,
      normalizedMobile,
      formattedMessage,
      whatsappUrl,
    };
  }
}
