import { BillingDateUtils, CalendarDate } from './billing-date.js';

export interface DateRangeUtc {
  startDate: Date;
  endDate: Date;
}

export class TimezoneUtils {
  public static readonly TIMEZONE = 'Asia/Kolkata';

  /**
   * Returns current Indian calendar date
   */
  static getTodayCalendarDate(): CalendarDate {
    return BillingDateUtils.parseCalendarDate(new Date());
  }

  /**
   * Converts a CalendarDate to the exact UTC start of that day (00:00:00.000 in IST).
   * Asia/Kolkata is UTC +05:30 with no daylight savings time.
   * IST 00:00:00 is (Previous day) 18:30:00 UTC.
   */
  static istCalendarDateToUtcStart(cal: CalendarDate): Date {
    // Midnight IST on YYYY-MM-DD
    const isoString = `${String(cal.year).padStart(4, '0')}-${String(cal.month).padStart(2, '0')}-${String(cal.day).padStart(2, '0')}T00:00:00.000+05:30`;
    return new Date(isoString);
  }

  /**
   * Converts a CalendarDate to the exact UTC end of that day (23:59:59.999 in IST).
   */
  static istCalendarDateToUtcEnd(cal: CalendarDate): Date {
    const isoString = `${String(cal.year).padStart(4, '0')}-${String(cal.month).padStart(2, '0')}-${String(cal.day).padStart(2, '0')}T23:59:59.999+05:30`;
    return new Date(isoString);
  }

  /**
   * Formats a Date into Asia/Kolkata YYYY-MM-DD string
   */
  static formatToIstDateString(date: Date | string): string {
    const cal = BillingDateUtils.parseCalendarDate(date);
    return BillingDateUtils.toDateString(cal);
  }

  /**
   * Formats a Date into Indian Display Date string (e.g., "12 Oct 2026")
   */
  static formatToIstDisplay(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: this.TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  }

  /**
   * Formats an amount into Indian Currency: ₹1,50,000
   */
  static formatIndianCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Resolves preset date range filters into UTC start/end bounding boxes in IST.
   * Preset options: 'today', 'yesterday', 'this_week', 'this_month', 'prev_month', 'this_year', 'custom'
   */
  static getDateRange(
    preset: string,
    customStart?: string,
    customEnd?: string
  ): DateRangeUtc {
    const todayCal = this.getTodayCalendarDate();

    switch (preset) {
      case 'today': {
        return {
          startDate: this.istCalendarDateToUtcStart(todayCal),
          endDate: this.istCalendarDateToUtcEnd(todayCal),
        };
      }
      case 'yesterday': {
        const yestCal = BillingDateUtils.subtractOneDay(todayCal);
        return {
          startDate: this.istCalendarDateToUtcStart(yestCal),
          endDate: this.istCalendarDateToUtcEnd(yestCal),
        };
      }
      case 'this_week': {
        // Find Monday of the current week in IST
        const todayUtcStart = this.istCalendarDateToUtcStart(todayCal);
        // Get day of week (0 = Sunday, 1 = Monday, etc.)
        const dayOfWeek = todayUtcStart.getUTCDay(); // note: in IST offset
        const daysSinceMonday = (dayOfWeek + 6) % 7; // Monday = 0, Sunday = 6
        
        let monCal = { ...todayCal };
        for (let i = 0; i < daysSinceMonday; i++) {
          monCal = BillingDateUtils.subtractOneDay(monCal);
        }
        return {
          startDate: this.istCalendarDateToUtcStart(monCal),
          endDate: this.istCalendarDateToUtcEnd(todayCal),
        };
      }
      case 'this_month': {
        const firstDayCal: CalendarDate = {
          year: todayCal.year,
          month: todayCal.month,
          day: 1,
        };
        const maxDays = BillingDateUtils.getDaysInMonth(todayCal.year, todayCal.month);
        const lastDayCal: CalendarDate = {
          year: todayCal.year,
          month: todayCal.month,
          day: maxDays,
        };
        return {
          startDate: this.istCalendarDateToUtcStart(firstDayCal),
          endDate: this.istCalendarDateToUtcEnd(lastDayCal),
        };
      }
      case 'prev_month': {
        let prevYear = todayCal.year;
        let prevMonth = todayCal.month - 1;
        if (prevMonth === 0) {
          prevMonth = 12;
          prevYear -= 1;
        }
        const maxDays = BillingDateUtils.getDaysInMonth(prevYear, prevMonth);
        return {
          startDate: this.istCalendarDateToUtcStart({ year: prevYear, month: prevMonth, day: 1 }),
          endDate: this.istCalendarDateToUtcEnd({ year: prevYear, month: prevMonth, day: maxDays }),
        };
      }
      case 'this_year': {
        return {
          startDate: this.istCalendarDateToUtcStart({ year: todayCal.year, month: 1, day: 1 }),
          endDate: this.istCalendarDateToUtcEnd({ year: todayCal.year, month: 12, day: 31 }),
        };
      }
      case 'custom':
      default: {
        if (customStart && customEnd) {
          const sCal = BillingDateUtils.parseCalendarDate(new Date(customStart));
          const eCal = BillingDateUtils.parseCalendarDate(new Date(customEnd));
          return {
            startDate: this.istCalendarDateToUtcStart(sCal),
            endDate: this.istCalendarDateToUtcEnd(eCal),
          };
        }
        // Default to this month
        return this.getDateRange('this_month');
      }
    }
  }
}
