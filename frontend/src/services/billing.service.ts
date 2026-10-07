import type {
  BillingPeriodWithPayments,
  PaymentDto,
  FeeReminderItem,
  PaymentMethod,
} from '../types/auth';
import { staticDb } from '../mock/staticData';
import { formatDate } from '../utils/dateUtils';

export interface RecordPaymentPayload {
  studentId: string;
  billingPeriodId: string;
  amount: number;
  paymentDate?: string;
  paymentMethod: PaymentMethod;
  reference?: string | null;
  note?: string | null;
}

export interface UpdatePaymentPayload {
  amount?: number;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  reference?: string | null;
  note?: string | null;
}

export interface BillingFilterQuery {
  status?: string;
  shift?: string;
  locker?: string;
  search?: string;
}

export class BillingService {
  static async getBillingPeriods(
    filters: BillingFilterQuery = {}
  ): Promise<BillingPeriodWithPayments[]> {
    await new Promise((r) => setTimeout(r, 60));
    return staticDb.getBillingPeriods(filters);
  }

  static async getStudentCurrentBilling(
    studentId: string
  ): Promise<BillingPeriodWithPayments | null> {
    await new Promise((r) => setTimeout(r, 40));
    return staticDb.getStudentCurrentBilling(studentId);
  }

  static async getStudentBillingHistory(
    studentId: string
  ): Promise<BillingPeriodWithPayments[]> {
    await new Promise((r) => setTimeout(r, 40));
    return staticDb.getStudentBillingHistory(studentId);
  }

  static async getPayments(filters: { search?: string; method?: string } = {}): Promise<PaymentDto[]> {
    await new Promise((r) => setTimeout(r, 60));
    return staticDb.getPayments(filters);
  }

  static async recordPayment(payload: RecordPaymentPayload): Promise<PaymentDto> {
    await new Promise((r) => setTimeout(r, 100));
    return staticDb.recordPayment(payload);
  }

  static async updatePayment(paymentId: string, payload: UpdatePaymentPayload): Promise<PaymentDto> {
    await new Promise((r) => setTimeout(r, 100));
    return staticDb.updatePayment(paymentId, payload);
  }

  static async getFeeReminders(): Promise<FeeReminderItem[]> {
    await new Promise((r) => setTimeout(r, 60));
    return staticDb.getFeeReminders();
  }

  static async prepareWhatsAppReminder(
    studentId: string,
    billingPeriodId: string
  ): Promise<{
    studentName: string;
    mobile: string;
    normalizedMobile: string;
    formattedMessage: string;
    whatsappUrl: string;
  }> {
    await new Promise((r) => setTimeout(r, 40));
    const student = staticDb.getStudentById(studentId);
    const bp = staticDb.getBillingPeriods().find((b) => b.id === billingPeriodId);

    const template = staticDb.getReminderTemplate();
    const amountStr = bp ? `₹${bp.outstanding}` : 'your pending fee';
    const dueDateStr = bp ? formatDate(bp.dueDate) : 'soon';

    const formattedMessage = template
      .replace(/{{studentName}}/g, student.name)
      .replace(/{{amount}}/g, amountStr)
      .replace(/{{dueDate}}/g, dueDateStr);

    let cleanMobile = student.mobile.replace(/\D/g, '');
    if (!cleanMobile.startsWith('91') && cleanMobile.length === 10) {
      cleanMobile = '91' + cleanMobile;
    }

    const encoded = encodeURIComponent(formattedMessage);
    const whatsappUrl = `https://wa.me/${cleanMobile}?text=${encoded}`;

    return {
      studentName: student.name,
      mobile: student.mobile,
      normalizedMobile: cleanMobile,
      formattedMessage,
      whatsappUrl,
    };
  }

  static async getReminderTemplate(): Promise<string> {
    return staticDb.getReminderTemplate();
  }

  static async updateReminderTemplate(template: string): Promise<string> {
    return staticDb.updateReminderTemplate(template);
  }
}
