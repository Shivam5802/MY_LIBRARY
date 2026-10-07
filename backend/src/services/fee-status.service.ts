import { BillingDateUtils } from '../utils/billing-date.js';
import { UserFacingFeeStatus } from '../types/index.js';

export interface CalculatedFeeStatus {
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  outstanding: number;
  status: UserFacingFeeStatus;
  daysRemaining: number;
}

export class FeeStatusService {
  /**
   * Calculates real-time fee status for a billing period given its payments, dueDate, and reference date.
   * Status should be calculated relative to the billing period's actual due date (Due Date - Current Date).
   *
   * If fully paid: PAID
   * If partially paid: PARTIALLY_PAID (when daysRemaining > 0) or OVERDUE (if daysRemaining < 0)
   * If unpaid and more than 5 days remain: DUE (normal upcoming/due status)
   * If 5 or fewer days remain before due date (5, 4, 3, 2, 1): DUE_SOON
   * If today is the due date (0 days remaining) and balance remains: DUE
   * If due date has passed (< 0 days remaining) and balance remains: OVERDUE
   */
  static calculateStatus(
    periodStart: Date,
    periodEnd: Date,
    amount: number,
    paidAmount: number,
    referenceDate: Date = new Date(),
    thresholdDays: number = 5,
    dueDateParam?: Date | null
  ): CalculatedFeeStatus {
    const outstanding = Math.max(0, amount - paidAmount);

    // If dueDate not explicitly provided, calculate deterministic anniversary (next day after periodEnd)
    const dueDate = dueDateParam || new Date(periodEnd.getTime() + 24 * 60 * 60 * 1000);

    const refCal = BillingDateUtils.parseCalendarDate(referenceDate);
    const dueCal = BillingDateUtils.parseCalendarDate(dueDate);

    // Days remaining = Due Date - Current Date (in Asia/Kolkata timezone)
    const daysRemaining = BillingDateUtils.diffInDays(refCal, dueCal);

    let status: UserFacingFeeStatus;

    if (outstanding <= 0.001) {
      status = UserFacingFeeStatus.PAID;
    } else if (daysRemaining < 0) {
      // Due date has passed and balance remains
      status = UserFacingFeeStatus.OVERDUE;
    } else if (daysRemaining === 0) {
      // Today is the due date and balance remains
      status = UserFacingFeeStatus.DUE;
    } else if (paidAmount > 0) {
      // Partially paid and still before due date
      status = UserFacingFeeStatus.PARTIALLY_PAID;
    } else if (daysRemaining <= thresholdDays) {
      // 5 or fewer days remain before due date (5, 4, 3, 2, 1)
      status = UserFacingFeeStatus.DUE_SOON;
    } else {
      // More than 5 days remain
      status = UserFacingFeeStatus.DUE;
    }

    return {
      periodStart,
      periodEnd,
      dueDate,
      amount,
      paidAmount,
      outstanding,
      status,
      daysRemaining,
    };
  }
}
