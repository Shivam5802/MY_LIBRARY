/**
 * Dedicated Indian Library Billing Date Engine
 *
 * Rules:
 * 1. Admission Date and Fee Cycle Start Date are separate concepts:
 *    - admissionDate = actual student admission date
 *    - feeCycleStartDate = date from which monthly fee counting starts
 * 2. Recurring billing periods anchor strictly to `feeCycleStartDate`:
 *    - Cycle N starts on `feeCycleStartDate` + N months (clipped if month is shorter)
 *    - Cycle N ends on ONE DAY BEFORE the next monthly anniversary (inclusive)
 *    - Cycle N due date is the NEXT MONTHLY ANNIVERSARY
 *    Example:
 *      Fee Cycle Start: 15-09-2026
 *      Cycle 0: 15-09-2026 -> 14-10-2026, Due Date: 15-10-2026
 *      Cycle 1: 15-10-2026 -> 14-11-2026, Due Date: 15-11-2026
 *      Cycle 2: 15-11-2026 -> 14-12-2026, Due Date: 15-12-2026
 * 3. Month End / Short Month Edge cases (28, 29, 30, 31):
 *    - If target month has fewer days than anchor day D, anchor clips to the last valid day of that month.
 *    - Example: 31-01-2026
 *      Next monthly anniversary clips to 28-02-2026 (or 29-02 in a leap year).
 *      Cycle 0: 31-01-2026 -> 27-02-2026 (or 28-02 in leap year). Due Date: 28-02-2026 (or 29-02 in leap year).
 *      Cycle 1: 28-02-2026 -> 30-03-2026. Due Date: 31-03-2026.
 *    - 30-01-2026:
 *      Next monthly anniversary clips to 28-02-2026 (29-02 in leap year).
 * 4. Calculations use calendar dates (YYYY-MM-DD) in Asia/Kolkata timezone without timezone shifts.
 * 5. Display presentation formats strictly to DD-MM-YYYY across the system.
 */

export interface CalendarDate {
  year: number;
  month: number; // 1-12
  day: number;   // 1-31
}

export interface BillingPeriodRange {
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date; // Next monthly anniversary date
}

export class BillingDateUtils {
  /**
   * Days in a given year and month (1-12)
   */
  static getDaysInMonth(year: number, month: number): number {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  /**
   * Parses Date or ISO string into CalendarDate (in Asia/Kolkata timezone)
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
   * Formats CalendarDate as YYYY-MM-DD (ISO date string)
   */
  static toDateString(cal: CalendarDate): string {
    const m = String(cal.month).padStart(2, '0');
    const d = String(cal.day).padStart(2, '0');
    return `${cal.year}-${m}-${d}`;
  }

  /**
   * Formats Date, string, or CalendarDate strictly as DD-MM-YYYY
   */
  static formatDate(dateInput: Date | string | CalendarDate | null | undefined): string {
    if (!dateInput) return '—';
    const cal =
      typeof dateInput === 'object' && dateInput !== null && 'year' in dateInput && 'month' in dateInput && 'day' in dateInput
        ? (dateInput as CalendarDate)
        : this.parseCalendarDate(dateInput as Date | string);
    const d = String(cal.day).padStart(2, '0');
    const m = String(cal.month).padStart(2, '0');
    return `${d}-${m}-${cal.year}`;
  }

  /**
   * Computes the N-th cycle anniversary date given feeCycleStartDate.
   * cycleIndex: 0 = start date, 1 = 1 month later, etc.
   * Clips day to last valid day of target month if target month is shorter.
   */
  static getCycleStartDate(feeCycleStartCal: CalendarDate, cycleIndex: number): CalendarDate {
    const totalMonths = feeCycleStartCal.year * 12 + (feeCycleStartCal.month - 1) + cycleIndex;
    const targetYear = Math.floor(totalMonths / 12);
    const targetMonth = (totalMonths % 12) + 1; // 1-12
    const maxDays = this.getDaysInMonth(targetYear, targetMonth);
    // Clip anchor day if month is shorter (e.g. 31 Jan -> 28 Feb)
    const targetDay = Math.min(feeCycleStartCal.day, maxDays);
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
   * Computes cycle start, period end, and due date for cycleIndex.
   * - periodStart = cycleIndex monthly anniversary
   * - dueDate = (cycleIndex + 1) monthly anniversary (1 month later)
   * - periodEnd = 1 day before dueDate
   *
   * Example:
   * feeCycleStartDate: 15-09-2026, cycleIndex: 0
   * periodStart = 15-09-2026
   * periodEnd = 14-10-2026
   * dueDate = 15-10-2026
   */
  static getBillingPeriodRange(
    feeCycleStartDateInput: Date | string,
    cycleIndex: number
  ): BillingPeriodRange {
    const feeCycleCal = this.parseCalendarDate(feeCycleStartDateInput);
    const startCal = this.getCycleStartDate(feeCycleCal, cycleIndex);
    const dueDateCal = this.getCycleStartDate(feeCycleCal, cycleIndex + 1);
    const endCal = this.subtractOneDay(dueDateCal);

    const periodStart = this.createUtcDate(startCal);
    const periodEnd = this.createUtcDate(endCal);
    const dueDate = this.createUtcDate(dueDateCal);

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
    feeCycleStartDateInput: Date | string,
    referenceDateInput: Date | string = new Date()
  ): number {
    const feeCycleCal = this.parseCalendarDate(feeCycleStartDateInput);
    const refCal = this.parseCalendarDate(referenceDateInput);

    // If reference is before fee cycle start date, it belongs to initial cycle 0
    if (this.diffInDays(feeCycleCal, refCal) < 0) {
      return 0;
    }

    // Rough month estimate
    const monthDiff =
      (refCal.year - feeCycleCal.year) * 12 + (refCal.month - feeCycleCal.month);
    let cycle = Math.max(0, monthDiff - 1);

    // Walk forward until cycle encompasses refCal
    while (true) {
      const nextDueDateCal = this.getCycleStartDate(feeCycleCal, cycle + 1);
      // If reference date is on or after nextDueDateCal, walk to next cycle
      if (this.diffInDays(nextDueDateCal, refCal) >= 0) {
        cycle++;
      } else {
        break;
      }
      if (cycle > 1200) break; // safety guard
    }

    return cycle;
  }
}
