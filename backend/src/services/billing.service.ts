import { prisma } from '../config/prisma.js';
import { BillingDateUtils } from '../utils/billing-date.js';
import { FeeStatusService } from './fee-status.service.js';
import {
  BillingStatus,
  BillingPeriodWithPayments,
  PaymentDto,
  PaymentMethod,
} from '../types/index.js';

export class BillingService {
  /**
   * Ensures that billing periods exist up to the current cycle for an active student.
   * If a student was admitted on 12 Sep, creates 12 Sep -> 11 Oct, and if today >= 12 Oct, also creates 12 Oct -> 11 Nov.
   * Idempotent: Never creates duplicate periods. Preserves historical amounts.
   */
  static async ensureStudentBillingPeriods(
    studentId: string,
    referenceDate: Date = new Date()
  ): Promise<void> {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) return;

    // Do not generate future periods for archived students
    if (student.status === 'ARCHIVED') return;

    const currentCycle = BillingDateUtils.findCycleIndexForDate(
      student.feeCycleStartDate,
      referenceDate
    );

    // Ensure all cycles from 0 up to currentCycle exist
    for (let c = 0; c <= currentCycle; c++) {
      const range = BillingDateUtils.getBillingPeriodRange(student.feeCycleStartDate, c);

      // Check if period already exists
      const existing = await prisma.billingPeriod.findUnique({
        where: {
          studentId_periodStart: {
            studentId: student.id,
            periodStart: range.periodStart,
          },
        },
      });

      if (!existing) {
        await prisma.billingPeriod.create({
          data: {
            studentId: student.id,
            periodStart: range.periodStart,
            periodEnd: range.periodEnd,
            dueDate: range.dueDate,
            amount: student.monthlyFee, // Uses student's monthlyFee at generation time
            status: BillingStatus.PENDING,
            shiftSnapshot: student.shift,
            lockerSnapshot: student.locker,
          },
        });
      }
    }
  }

  /**
   * Retrieves current active billing period for a student.
   */
  static async getCurrentBillingPeriod(
    studentId: string,
    referenceDate: Date = new Date()
  ): Promise<BillingPeriodWithPayments | null> {
    await this.ensureStudentBillingPeriods(studentId, referenceDate);

    const periods = await prisma.billingPeriod.findMany({
      where: { studentId },
      orderBy: { periodStart: 'desc' },
      include: {
        payments: { orderBy: { paymentDate: 'desc' } },
        student: {
          include: {
            assignments: { where: { isCurrent: true }, include: { seat: true } },
          },
        },
      },
    });

    if (periods.length === 0) return null;

    // The most recent cycle covering or preceding referenceDate
    const currentPeriodRecord = periods[0]!;
    return this.mapBillingPeriodRecord(currentPeriodRecord, referenceDate);
  }

  /**
   * Retrieves full chronological billing history for a student.
   */
  static async getStudentBillingHistory(
    studentId: string,
    referenceDate: Date = new Date()
  ): Promise<BillingPeriodWithPayments[]> {
    await this.ensureStudentBillingPeriods(studentId, referenceDate);

    const periods = await prisma.billingPeriod.findMany({
      where: { studentId },
      orderBy: { periodStart: 'desc' },
      include: {
        payments: { orderBy: { paymentDate: 'desc' } },
        student: {
          include: {
            assignments: { where: { isCurrent: true }, include: { seat: true } },
          },
        },
      },
    });

    return periods.map((p) => this.mapBillingPeriodRecord(p, referenceDate));
  }

  /**
   * Retrieves all billing periods across students with optional status, shift, locker, and search filters.
   */
  static async getAllBillingPeriods(
    filters: {
      status?: string;
      shift?: string;
      locker?: string;
      search?: string;
    } = {},
    referenceDate: Date = new Date()
  ): Promise<BillingPeriodWithPayments[]> {
    // Sync periods for all active students first
    const activeStudents = await prisma.student.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });
    for (const s of activeStudents) {
      await this.ensureStudentBillingPeriods(s.id, referenceDate);
    }

    const where: any = {};
    if (filters.shift || filters.locker || filters.search) {
      where.student = {};
      if (filters.shift) where.student.shift = filters.shift;
      if (filters.locker) where.student.locker = filters.locker;
      if (filters.search) {
        const q = filters.search.trim();
        const seatNum = parseInt(q, 10);
        const orConditions: any[] = [
          { name: { contains: q, mode: 'insensitive' } },
          { mobile: { contains: q, mode: 'insensitive' } },
        ];
        if (!isNaN(seatNum) && seatNum >= 1 && seatNum <= 92) {
          orConditions.push({
            assignments: {
              some: { isCurrent: true, seat: { seatNumber: seatNum } },
            },
          });
        }
        where.student.OR = orConditions;
      }
    }

    const records = await prisma.billingPeriod.findMany({
      where,
      orderBy: { periodEnd: 'desc' },
      include: {
        payments: { orderBy: { paymentDate: 'desc' } },
        student: {
          include: {
            assignments: { where: { isCurrent: true }, include: { seat: true } },
          },
        },
      },
    });

    const mapped = records.map((r) => this.mapBillingPeriodRecord(r, referenceDate));

    // Filter by calculated status if requested
    if (filters.status && filters.status !== 'ALL') {
      return mapped.filter((m) => m.status === filters.status);
    }

    return mapped;
  }

  /**
   * Helper to serialize and compute real-time fee status for a billing period record.
   */
  private static mapBillingPeriodRecord(
    record: any,
    referenceDate: Date
  ): BillingPeriodWithPayments {
    const totalAmount = Number(record.amount);
    const paidAmount = record.payments.reduce(
      (sum: number, p: any) => sum + Number(p.amount),
      0
    );

    const calc = FeeStatusService.calculateStatus(
      record.periodStart,
      record.periodEnd,
      totalAmount,
      paidAmount,
      referenceDate,
      5,
      record.dueDate
    );

    const currentSeatAssignment = record.student?.assignments?.find((a: any) => a.isCurrent);
    const seatNumber = currentSeatAssignment?.seat?.seatNumber ?? null;

    const payments: PaymentDto[] = record.payments.map((p: any) => ({
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
      studentName: record.student?.name,
      seatNumber,
    }));

    return {
      id: record.id,
      studentId: record.studentId,
      periodStart: record.periodStart.toISOString(),
      periodEnd: record.periodEnd.toISOString(),
      dueDate: calc.dueDate.toISOString(),
      amount: calc.amount,
      paidAmount: calc.paidAmount,
      outstanding: calc.outstanding,
      status: calc.status,
      daysRemaining: calc.daysRemaining,
      student: record.student
        ? {
            id: record.student.id,
            name: record.student.name,
            mobile: record.student.mobile,
            photoUrl: record.student.photoUrl,
            seatNumber,
          }
        : undefined,
      payments,
    };
  }
}
