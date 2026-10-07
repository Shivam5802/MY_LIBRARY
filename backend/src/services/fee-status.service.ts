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
   * Calculates real-time fee status for a billing period given its payments and reference date.
   */
  static calculateStatus(
    periodStart: Date,
    periodEnd: Date,
    amount: number,
    paidAmount: number,
    referenceDate: Date = new Date(),
    thresholdDays: number = 5
  ): CalculatedFeeStatus {
    const outstanding = Math.max(0, amount - paidAmount);
    const dueDate = periodEnd;

    const refCal = BillingDateUtils.parseCalendarDate(referenceDate);
    const endCal = BillingDateUtils.parseCalendarDate(periodEnd);

    // Days remaining = endCal - refCal (inclusive countdown)
    const daysRemaining = BillingDateUtils.diffInDays(refCal, endCal);

    let status: UserFacingFeeStatus;

    if (outstanding <= 0.001) {
      status = UserFacingFeeStatus.PAID;
    } else if (paidAmount > 0 && daysRemaining > 0) {
      status = UserFacingFeeStatus.PARTIALLY_PAID;
    } else if (daysRemaining < 0) {
      // Period has ended and money is unpaid
      status = UserFacingFeeStatus.OVERDUE;
    } else if (daysRemaining === 0) {
      // Exactly on the due date
      status = UserFacingFeeStatus.DUE;
    } else if (daysRemaining <= thresholdDays) {
      // Within reminder window (e.g. 5 days or fewer)
      status = UserFacingFeeStatus.DUE_SOON;
    } else {
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
