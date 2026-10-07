/**
 * Centralized Date Formatting Utility for MY LIBRARY Frontend
 *
 * In accordance with business rules:
 * Every date displayed anywhere in the application must use DD-MM-YYYY format.
 * Example: 10-09-2026
 *
 * Keep internal representations as ISO strings / Date objects, and format at display layer.
 */

export interface CalendarDateParts {
  year: number;
  month: number;
  day: number;
}

/**
 * Returns days in a given year and month (1-12)
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Parses any valid Date, ISO string, or timestamp into calendar date parts in Asia/Kolkata timezone
 */
export function parseCalendarDate(dateInput: Date | string | number): CalendarDateParts {
  const d = typeof dateInput === 'object' && dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) {
    return { year: 1970, month: 1, day: 1 };
  }
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(d);
  const year = parseInt(parts.find((p) => p.type === 'year')?.value || '1970', 10);
  const month = parseInt(parts.find((p) => p.type === 'month')?.value || '1', 10);
  const day = parseInt(parts.find((p) => p.type === 'day')?.value || '1', 10);
  return { year, month, day };
}

/**
 * Formats any Date or date string strictly as DD-MM-YYYY
 * Example: 10-09-2026
 */
export function formatDate(dateInput?: Date | string | number | null): string {
  if (!dateInput) return '-';
  const parts = parseCalendarDate(dateInput);
  const dd = String(parts.day).padStart(2, '0');
  const mm = String(parts.month).padStart(2, '0');
  return `${dd}-${mm}-${parts.year}`;
}

/**
 * Computes next monthly anniversary date clipping to month end if needed.
 * Example: 31 Jan -> 28/29 Feb
 */
export function getCycleAnniversary(startDate: Date | string, monthsToAdd: number): Date {
  const cal = parseCalendarDate(startDate);
  const totalMonths = cal.year * 12 + (cal.month - 1) + monthsToAdd;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1; // 1-12
  const maxDays = getDaysInMonth(targetYear, targetMonth);
  const targetDay = Math.min(cal.day, maxDays);
  return new Date(Date.UTC(targetYear, targetMonth - 1, targetDay, 0, 0, 0, 0));
}

/**
 * Subtracts one day from a Date
 */
export function subtractDays(date: Date, days: number = 1): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() - days);
  return copy;
}

/**
 * Computes standard billing period range from feeCycleStartDate:
 * periodStart: feeCycleStartDate
 * periodEnd: 1 day before next monthly anniversary
 * dueDate: next monthly anniversary
 */
export function calculateBillingPeriod(feeCycleStartDateInput: Date | string, cycleIndex: number = 0) {
  const startAnniversary = getCycleAnniversary(feeCycleStartDateInput, cycleIndex);
  const nextAnniversary = getCycleAnniversary(feeCycleStartDateInput, cycleIndex + 1);
  const periodEnd = subtractDays(nextAnniversary, 1);
  const dueDate = nextAnniversary;

  return {
    periodStart: startAnniversary,
    periodEnd,
    dueDate,
  };
}

/**
 * Formats a Date to ISO date-only format (YYYY-MM-DD) for HTML native input[type="date"]
 */
export function toInputDateValue(dateInput?: Date | string | number | null): string {
  if (!dateInput) return '';
  const parts = parseCalendarDate(dateInput);
  const mm = String(parts.month).padStart(2, '0');
  const dd = String(parts.day).padStart(2, '0');
  return `${parts.year}-${mm}-${dd}`;
}
