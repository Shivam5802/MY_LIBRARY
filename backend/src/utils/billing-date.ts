/**
 * Dedicated Indian Library Billing Date Engine
 *
 * Rules:
 * 1. Calendar cycles anchor to individual student admission dates (e.g. 12th of month -> 12th of next month - 1 day).
 * 2. Cycle starts on day `D` of month `M1`, ends on day `D-1` of month `M2` (inclusive).
 *    Example: 12 Sep -> 11 Oct. Next cycle: 12 Oct -> 11 Nov.
 * 3. Month End / Short Month Edge cases (28, 29, 30, 31):
 *    - If target month has fewer days than anchor day D, anchor clips to last day of that month.
 *    - Example: Admission 31 Jan -> Next cycle starts 28/29 Feb, period end is (28/29 Feb - 1 day? NO:
 *      A cycle runs from 31 Jan to the day before the next anchor date).
 *      If Next Anchor is 28 Feb, period is 31 Jan -> 27 Feb.
 *      If admission is 31 Jan, next anchor is 28 Feb (or 29 in leap year).
 *      Next anchor after Feb is 31 Mar. So Feb period is 28 Feb -> 30 Mar.
 * 4. Calculations use calendar dates (YYYY-MM-DD) without timezone shifts.
 */

export interface CalendarDate {
  year: number;
  month: number; // 1-12
  day: number;   // 1-31
}

export interface BillingPeriodRange {
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date; // Last day of billing period
}

export class BillingDateUtils {
  /**
   * Days in a given year and month (1-12)
   */
  static getDaysInMonth(year: number, month: number): number {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  /**
   * Parses Date or ISO string into CalendarDate (in Asia/Kolkata or UTC date space)
   */
  static parseCalendarDate(dateInput: Date | string): CalendarDate {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    // Format to YYYY-MM-DD using Indian/Kolkata timezone to prevent UTC day rollback
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(d);
    const year = parseInt(parts.find((p) => p.type === 'year')!.value, 10);
    const month = parseInt(parts.find((p) => p.type === 'month')!.value, 10);
    const day = parseInt(parts.find((p) => p.type === 'day')!.value, 10);
    return { year, month, day };
  }

  /**
   * Creates a UTC Date representing start of day (00:00:00.000Z) from CalendarDate
   */
  static createUtcDate(cal: CalendarDate): Date {
    return new Date(Date.UTC(cal.year, cal.month - 1, cal.day, 0, 0, 0, 0));
  }

  /**
   * Formats CalendarDate as YYYY-MM-DD
   */
  static toDateString(cal: CalendarDate): string {
    const m = String(cal.month).padStart(2, '0');
    const d = String(cal.day).padStart(2, '0');
    return `${cal.year}-${m}-${d}`;
  }

  /**
   * Computes the N-th cycle anniversary start date given anchorDay (1-31) and admission year/month.
   * cycleIndex: 0 = admission cycle, 1 = 1 month later, etc.
   */
  static getCycleStartDate(admissionCal: CalendarDate, cycleIndex: number): CalendarDate {
    const totalMonths = admissionCal.year * 12 + (admissionCal.month - 1) + cycleIndex;
    const targetYear = Math.floor(totalMonths / 12);
    const targetMonth = (totalMonths % 12) + 1; // 1-12
    const maxDays = this.getDaysInMonth(targetYear, targetMonth);
    // Clip anchor day if month is shorter
    const targetDay = Math.min(admissionCal.day, maxDays);
    return { year: targetYear, month: targetMonth, day: targetDay };
  }

  /**
   * Subtracts 1 day from a CalendarDate
   */
  static subtractOneDay(cal: CalendarDate): CalendarDate {
    const d = new Date(Date.UTC(cal.year, cal.month - 1, cal.day));
    d.setUTCDate(d.getUTCDate() - 1);
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
    };
  }

  /**
   * Difference in calendar days between dateA and dateB (dateB - dateA)
   */
  static diffInDays(calA: CalendarDate, calB: CalendarDate): number {
    const utcA = Date.UTC(calA.year, calA.month - 1, calA.day);
    const utcB = Date.UTC(calB.year, calB.month - 1, calB.day);
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((utcB - utcA) / msPerDay);
  }

  /**
   * Computes cycle start and end for cycleIndex.
   * Cycle N ends on the day immediately preceding Cycle N+1's start date.
   */
  static getBillingPeriodRange(
    admissionDateInput: Date | string,
    cycleIndex: number
  ): BillingPeriodRange {
    const admissionCal = this.parseCalendarDate(admissionDateInput);
    const startCal = this.getCycleStartDate(admissionCal, cycleIndex);
    const nextStartCal = this.getCycleStartDate(admissionCal, cycleIndex + 1);
    const endCal = this.subtractOneDay(nextStartCal);

    const periodStart = this.createUtcDate(startCal);
    const periodEnd = this.createUtcDate(endCal);
    const dueDate = periodEnd;

    return {
      periodStart,
      periodEnd,
      dueDate,
    };
  }

  /**
   * Determines which cycleIndex encompasses the given reference date (or current date).
   */
  static findCycleIndexForDate(
    admissionDateInput: Date | string,
    referenceDateInput: Date | string = new Date()
  ): number {
    const admissionCal = this.parseCalendarDate(admissionDateInput);
    const refCal = this.parseCalendarDate(referenceDateInput);

    // If reference is before admission, it belongs to initial cycle 0
    if (this.diffInDays(admissionCal, refCal) < 0) {
      return 0;
    }

    // Rough month estimate
    const monthDiff =
      (refCal.year - admissionCal.year) * 12 + (refCal.month - admissionCal.month);
    let cycle = Math.max(0, monthDiff - 1);

    // Walk forward until cycle encompasses refCal
    while (true) {
      const nextStartCal = this.getCycleStartDate(admissionCal, cycle + 1);
      if (this.diffInDays(refCal, nextStartCal) > 0) {
        // refCal is strictly before next cycle's start date
        break;
      }
      cycle++;
      if (cycle > 1200) break; // safety guard
    }

    return cycle;
  }
}
