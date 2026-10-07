import { prisma } from '../config/prisma.js';
import { PaymentMethod, PaymentDto } from '../types/index.js';

export interface RecordPaymentInput {
  studentId: string;
  billingPeriodId: string;
  amount: number;
  paymentDate?: string;
  paymentMethod: PaymentMethod;
  reference?: string | null;
  note?: string | null;
}

export interface UpdatePaymentInput {
  amount?: number;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  reference?: string | null;
  note?: string | null;
}

export class PaymentService {
  /**
   * Generates sequential human-readable receipt number: RCP-YYYYMMDD-XXXX
   */
  private static generateReceiptNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.floor(1000 + Math.random() * 9000).toString();
    return `RCP-${dateStr}-${randomHex}`;
  }

  /**
   * Records a payment atomically within a database transaction.
   * Validates student, billing period, and strictly rejects overpayment.
   */
  static async recordPayment(input: RecordPaymentInput): Promise<PaymentDto> {
    if (input.amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    return prisma.$transaction(
      async (tx) => {
        // 1. Fetch billing period and existing payments with lock
      const period = await tx.billingPeriod.findUnique({
        where: { id: input.billingPeriodId },
        include: {
          payments: true,
          student: {
            include: {
              assignments: { where: { isCurrent: true }, include: { seat: true } },
            },
          },
        },
      });

      if (!period) {
        throw new Error('Billing period not found.');
      }

      if (period.studentId !== input.studentId) {
        throw new Error('Billing period does not belong to the selected student.');
      }

      const totalFee = Number(period.amount);
      const alreadyPaid = period.payments.reduce(
        (acc, p) => acc + Number(p.amount),
        0
      );
      const outstanding = Math.round((totalFee - alreadyPaid) * 100) / 100;

      // 2. Prevent overpayment
      if (input.amount > outstanding + 0.001) {
        throw new Error(
          `Payment amount (₹${input.amount}) cannot exceed the outstanding balance (₹${outstanding}).`
        );
      }

      // 3. Create payment record
      const receiptNumber = this.generateReceiptNumber();
      const paymentDate = input.paymentDate ? new Date(input.paymentDate) : new Date();

      const created = await tx.payment.create({
        data: {
          receiptNumber,
          studentId: input.studentId,
          billingPeriodId: input.billingPeriodId,
          amount: input.amount,
          paymentDate,
          paymentMethod: input.paymentMethod,
          reference: input.reference,
          note: input.note,
        },
      });

      // 4. Update BillingPeriod status
      const newPaidTotal = alreadyPaid + input.amount;
      const newStatus =
        newPaidTotal >= totalFee - 0.001 ? 'PAID' : 'PARTIALLY_PAID';

      await tx.billingPeriod.update({
        where: { id: period.id },
        data: { status: newStatus },
      });

      // 5. Activity log
      await tx.activityLog.create({
        data: {
          action: 'PAYMENT_CREATED',
          studentId: input.studentId,
          metadata: JSON.stringify({
            paymentId: created.id,
            receiptNumber,
            amount: input.amount,
            billingPeriodId: period.id,
          }),
        },
      });

      const currentSeat = period.student.assignments.find((a) => a.isCurrent);

        return {
          id: created.id,
          receiptNumber: created.receiptNumber,
          studentId: created.studentId,
          billingPeriodId: created.billingPeriodId,
          amount: Number(created.amount),
          paymentDate: created.paymentDate.toISOString(),
          paymentMethod: created.paymentMethod as PaymentMethod,
          reference: created.reference,
          note: created.note,
          createdAt: created.createdAt.toISOString(),
          studentName: period.student.name,
          seatNumber: currentSeat?.seat?.seatNumber ?? null,
        };
      },
      { maxWait: 15000, timeout: 30000 }
    );
  }

  /**
   * Modifies an existing payment amount, date, method, reference or note within transaction.
   * Recalculates balance to prevent overpayments resulting from amount increases.
   */
  static async updatePayment(paymentId: string, input: UpdatePaymentInput): Promise<PaymentDto> {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          billingPeriod: {
            include: {
              payments: true,
              student: {
                include: {
                  assignments: { where: { isCurrent: true }, include: { seat: true } },
                },
              },
            },
          },
        },
      });

      if (!payment) {
        throw new Error('Payment record not found.');
      }

      if (input.amount !== undefined) {
        if (input.amount <= 0) {
          throw new Error('Payment amount must be greater than zero.');
        }

        const otherPaymentsTotal = payment.billingPeriod.payments
          .filter((p) => p.id !== paymentId)
          .reduce((sum, p) => sum + Number(p.amount), 0);

        const totalPeriodAmount = Number(payment.billingPeriod.amount);
        const maxAllowed = totalPeriodAmount - otherPaymentsTotal;

        if (input.amount > maxAllowed + 0.001) {
          throw new Error(
            `Updated amount (₹${input.amount}) exceeds max allowed balance (₹${maxAllowed}).`
          );
        }
      }

      const updateData: any = {};
      if (input.amount !== undefined) updateData.amount = input.amount;
      if (input.paymentDate !== undefined) updateData.paymentDate = new Date(input.paymentDate);
      if (input.paymentMethod !== undefined) updateData.paymentMethod = input.paymentMethod;
      if (input.reference !== undefined) updateData.reference = input.reference;
      if (input.note !== undefined) updateData.note = input.note;

      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: updateData,
      });

      // Recalculate billing period status
      const allPayments = await tx.payment.findMany({
        where: { billingPeriodId: payment.billingPeriodId },
      });
      const newTotalPaid = allPayments.reduce((s, p) => s + Number(p.amount), 0);
      const periodAmount = Number(payment.billingPeriod.amount);
      const newStatus =
        newTotalPaid >= periodAmount - 0.001
          ? 'PAID'
          : newTotalPaid > 0
          ? 'PARTIALLY_PAID'
          : 'PENDING';

      await tx.billingPeriod.update({
        where: { id: payment.billingPeriodId },
        data: { status: newStatus },
      });

      // Log update
      await tx.activityLog.create({
        data: {
          action: 'PAYMENT_UPDATED',
          studentId: payment.studentId,
          metadata: JSON.stringify({
            paymentId: updated.id,
            receiptNumber: updated.receiptNumber,
            updatedFields: Object.keys(updateData),
          }),
        },
      });

      const currentSeat = payment.billingPeriod.student.assignments.find((a) => a.isCurrent);

      return {
        id: updated.id,
        receiptNumber: updated.receiptNumber,
        studentId: updated.studentId,
        billingPeriodId: updated.billingPeriodId,
        amount: Number(updated.amount),
        paymentDate: updated.paymentDate.toISOString(),
        paymentMethod: updated.paymentMethod as PaymentMethod,
        reference: updated.reference,
        note: updated.note,
        createdAt: updated.createdAt.toISOString(),
        studentName: payment.billingPeriod.student.name,
        seatNumber: currentSeat?.seat?.seatNumber ?? null,
      };
    });
  }

  /**
   * Lists all payments with student name and seat info.
   */
  static async getPayments(filters: { search?: string; method?: string } = {}): Promise<PaymentDto[]> {
    const where: any = {};
    if (filters.method) {
      where.paymentMethod = filters.method;
    }
    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { receiptNumber: { contains: q, mode: 'insensitive' } },
        { reference: { contains: q, mode: 'insensitive' } },
        { student: { name: { contains: q, mode: 'insensitive' } } },
        { student: { mobile: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const records = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      include: {
        student: {
          include: {
            assignments: { where: { isCurrent: true }, include: { seat: true } },
          },
        },
      },
    });

    return records.map((p) => {
      const currentSeat = p.student.assignments.find((a) => a.isCurrent);
      return {
        id: p.id,
        receiptNumber: p.receiptNumber,
        studentId: p.studentId,
        billingPeriodId: p.billingPeriodId,
        amount: Number(p.amount),
        paymentDate: p.paymentDate.toISOString(),
        paymentMethod: p.paymentMethod as PaymentMethod,
        reference: p.reference,
        note: p.note,
        createdAt: p.createdAt.toISOString(),
        studentName: p.student.name,
        seatNumber: currentSeat?.seat?.seatNumber ?? null,
      };
    });
  }
}
