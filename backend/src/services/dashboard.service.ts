import { prisma } from '../config/prisma.js';
import { BillingService } from './billing.service.js';
import {
  OwnerDashboardStats,
  SeatStatus,
  StudentStatus,
  UserFacingFeeStatus,
} from '../types/index.js';

export class DashboardService {
  static async getOwnerStats(): Promise<OwnerDashboardStats> {
    const totalSeats = 92;

    const occupiedSeats = await prisma.seat.count({ where: { status: SeatStatus.OCCUPIED } });
    const activeStudents = await prisma.student.count({ where: { status: StudentStatus.ACTIVE } });
    const archivedStudents = await prisma.student.count({ where: { status: StudentStatus.ARCHIVED } });
    const allPeriods = await BillingService.getAllBillingPeriods();
    const allPayments = await prisma.payment.findMany({ select: { amount: true } });

    const availableSeats = Math.max(0, totalSeats - occupiedSeats);

    // Calculate fee counts
    let feesDueSoon = 0;
    let feesDue = 0;
    let feesOverdue = 0;

    for (const p of allPeriods) {
      if (p.status === UserFacingFeeStatus.DUE_SOON) feesDueSoon++;
      else if (p.status === UserFacingFeeStatus.DUE) feesDue++;
      else if (p.status === UserFacingFeeStatus.OVERDUE) feesOverdue++;
    }

    const collectedThisPeriod = allPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    return {
      totalSeats,
      occupiedSeats,
      availableSeats,
      activeStudents,
      archivedStudents,
      feesDueSoon,
      feesDue,
      feesOverdue,
      collectedThisPeriod,
    };
  }
}
