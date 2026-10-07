import { prisma } from '../config/prisma.js';
import { DataIntegrityReport, DataIntegrityIssue } from '../types/index.js';

export class DataIntegrityService {
  /**
   * Diagnostic checker running 9 essential integrity validations without modifying any data.
   */
  static async runIntegrityCheck(): Promise<DataIntegrityReport> {
    const issues: DataIntegrityIssue[] = [];

    // Check 1: Seat count and missing seats among 1–92
    const allSeats = await prisma.seat.findMany({ select: { seatNumber: true, id: true, status: true } });
    const seatNumberSet = new Set(allSeats.map((s) => s.seatNumber));
    const missingSeats: number[] = [];

    for (let i = 1; i <= 92; i++) {
      if (!seatNumberSet.has(i)) {
        missingSeats.push(i);
      }
    }

    if (missingSeats.length > 0) {
      issues.push({
        id: 'CHECK-MISSING-SEATS',
        category: 'Seats',
        severity: 'ERROR',
        description: `Missing seat numbers in range 1–92: [${missingSeats.join(', ')}].`,
        details: { missingSeats },
      });
    }

    // Check 2: More than one active assignment for a seat
    const seatAssignments = await prisma.studentSeatAssignment.groupBy({
      by: ['seatId'],
      where: { isCurrent: true },
      _count: { studentId: true },
      having: { studentId: { _count: { gt: 1 } } },
    });

    if (seatAssignments.length > 0) {
      issues.push({
        id: 'CHECK-MULTIPLE-ASSIGNMENTS-PER-SEAT',
        category: 'Seats',
        severity: 'ERROR',
        description: `Found ${seatAssignments.length} seat(s) assigned to more than one active student simultaneously.`,
        details: seatAssignments,
      });
    }

    // Check 3: Occupied seat without current assignment
    const occupiedSeats = await prisma.seat.findMany({
      where: {
        status: 'OCCUPIED',
        assignments: { none: { isCurrent: true } },
      },
    });

    if (occupiedSeats.length > 0) {
      issues.push({
        id: 'CHECK-OCCUPIED-SEAT-WITHOUT-ASSIGNMENT',
        category: 'Seats',
        severity: 'WARNING',
        description: `Found ${occupiedSeats.length} seat(s) marked OCCUPIED but with no current active assignment.`,
        details: occupiedSeats.map((s) => s.seatNumber),
      });
    }

    // Check 4: Available seat with active assignment
    const availableWithAssignment = await prisma.seat.findMany({
      where: {
        status: 'AVAILABLE',
        assignments: { some: { isCurrent: true } },
      },
    });

    if (availableWithAssignment.length > 0) {
      issues.push({
        id: 'CHECK-AVAILABLE-SEAT-WITH-ASSIGNMENT',
        category: 'Seats',
        severity: 'ERROR',
        description: `Found ${availableWithAssignment.length} seat(s) marked AVAILABLE but possessing an active student assignment.`,
        details: availableWithAssignment.map((s) => s.seatNumber),
      });
    }

    // Check 5: Active student assigned to multiple current seats
    const studentMultiSeats = await prisma.studentSeatAssignment.groupBy({
      by: ['studentId'],
      where: { isCurrent: true },
      _count: { seatId: true },
      having: { seatId: { _count: { gt: 1 } } },
    });

    if (studentMultiSeats.length > 0) {
      issues.push({
        id: 'CHECK-STUDENT-MULTIPLE-SEATS',
        category: 'Students',
        severity: 'ERROR',
        description: `Found ${studentMultiSeats.length} student(s) currently assigned to multiple seats simultaneously.`,
        details: studentMultiSeats,
      });
    }

    // Check 6: Duplicate billing periods for same student and periodStart
    const duplicatePeriods = await prisma.billingPeriod.groupBy({
      by: ['studentId', 'periodStart'],
      _count: { id: true },
      having: { id: { _count: { gt: 1 } } },
    });

    if (duplicatePeriods.length > 0) {
      issues.push({
        id: 'CHECK-DUPLICATE-BILLING-PERIODS',
        category: 'Billing',
        severity: 'ERROR',
        description: `Found ${duplicatePeriods.length} duplicate billing period cycle(s) with identical student and periodStart.`,
        details: duplicatePeriods,
      });
    }

    // Check 7: Payment exceeding billing amount (Overpayments)
    const allBillingWithPayments = await prisma.billingPeriod.findMany({
      include: {
        payments: true,
        student: { select: { name: true } },
      },
    });

    const overpaidPeriods: any[] = [];
    for (const bp of allBillingWithPayments) {
      const totalPaid = bp.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const fee = Number(bp.amount);
      if (totalPaid > fee + 0.01) {
        overpaidPeriods.push({
          billingPeriodId: bp.id,
          studentName: bp.student.name,
          fee,
          totalPaid,
          difference: totalPaid - fee,
        });
      }
    }

    if (overpaidPeriods.length > 0) {
      issues.push({
        id: 'CHECK-PAYMENTS-EXCEEDING-BILLING',
        category: 'Billing',
        severity: 'WARNING',
        description: `Found ${overpaidPeriods.length} billing period(s) where total recorded payments exceed the billed fee.`,
        details: overpaidPeriods,
      });
    }

    // Check 8: Billing period with invalid dates (periodStart >= periodEnd)
    const invalidPeriods = await prisma.billingPeriod.findMany({
      where: {
        periodStart: { gte: prisma.billingPeriod.fields.periodEnd },
      },
    }).catch(async () => {
      // In case Prisma fields comparison is not supported directly in raw filter
      const periods = await prisma.billingPeriod.findMany({
        select: { id: true, periodStart: true, periodEnd: true },
      });
      return periods.filter((p) => p.periodStart >= p.periodEnd);
    });

    if (invalidPeriods.length > 0) {
      issues.push({
        id: 'CHECK-INVALID-BILLING-DATES',
        category: 'Billing',
        severity: 'ERROR',
        description: `Found ${invalidPeriods.length} billing period(s) where periodStart is on or after periodEnd.`,
        details: invalidPeriods.map((p) => p.id),
      });
    }

    // Check 9: Broken student relationships (payments or periods with non-existent student)
    const brokenPayments = (await prisma.$queryRaw`
      SELECT p.id FROM payments p
      LEFT JOIN students s ON p.student_id = s.id
      WHERE s.id IS NULL
    `.catch(() => [])) as any[];

    if (brokenPayments.length > 0) {
      issues.push({
        id: 'CHECK-BROKEN-PAYMENT-RELATIONS',
        category: 'Integrity',
        severity: 'ERROR',
        description: `Found ${brokenPayments.length} orphan payment(s) without an associated student record.`,
        details: brokenPayments.map((b) => b.id),
      });
    }

    // Determine overall diagnostic status
    const hasError = issues.some((i) => i.severity === 'ERROR');
    const hasWarning = issues.some((i) => i.severity === 'WARNING');
    const overallStatus = hasError ? 'ERROR' : hasWarning ? 'WARNING' : 'PASS';

    return {
      overallStatus,
      checkedAt: new Date().toISOString(),
      totalChecks: 9,
      issues,
    };
  }
}
