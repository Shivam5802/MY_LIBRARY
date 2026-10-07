import { prisma } from '../config/prisma.js';
import { BillingService } from './billing.service.js';
import { TimezoneUtils } from '../utils/timezone.js';
import { BillingDateUtils } from '../utils/billing-date.js';
import {
  DeveloperDashboardStats,
  DeveloperIncomeOverview,
  IncomeTrendPoint,
  PaymentMethodBreakdownItem,
  ShiftIncomeItem,
  LockerIncomeItem,
  PaymentDto,
  PaymentMethod,
  Shift,
  Locker,
} from '../types/index.js';

export interface IncomeFilters {
  preset?: string;
  startDate?: string;
  endDate?: string;
  method?: string;
  shift?: string;
  locker?: string;
  interval?: 'daily' | 'weekly' | 'monthly';
}

export class IncomeReportService {
  /**
   * Calculates dashboard summary cards:
   * 1. Lifetime Income (SUM of all valid payments)
   * 2. Today's Income (Asia/Kolkata business day)
   * 3. Current Month Income (1st of month till end in Asia/Kolkata)
   * 4. Previous Month Income (entire previous month)
   * 5. Current Year Income (Jan 1 till end of year)
   * 6. Pending Fees (Sum of outstanding balances for active periods)
   * 7. Expected Income (sum of outstanding fees on current active periods)
   * 8. Active Students count
   */
  static async getDeveloperDashboardStats(): Promise<DeveloperDashboardStats> {
    const todayRange = TimezoneUtils.getDateRange('today');
    const thisMonthRange = TimezoneUtils.getDateRange('this_month');
    const prevMonthRange = TimezoneUtils.getDateRange('prev_month');
    const thisYearRange = TimezoneUtils.getDateRange('this_year');

    // Make sure current billing periods are synchronized
    const allBillingPeriods = await BillingService.getAllBillingPeriods();

    // 1. Aggregations on payments
    const [
      lifetimeAgg,
      todayAgg,
      thisMonthAgg,
      prevMonthAgg,
      thisYearAgg,
      activeStudentsCount,
    ] = await Promise.all([
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.payment.aggregate({
        where: {
          paymentDate: { gte: todayRange.startDate, lte: todayRange.endDate },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          paymentDate: { gte: thisMonthRange.startDate, lte: thisMonthRange.endDate },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          paymentDate: { gte: prevMonthRange.startDate, lte: prevMonthRange.endDate },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          paymentDate: { gte: thisYearRange.startDate, lte: thisYearRange.endDate },
        },
        _sum: { amount: true },
      }),
      prisma.student.count({ where: { status: 'ACTIVE' } }),
    ]);

    // 2. Pending fees & expected income from outstanding billing periods
    let pendingFees = 0;
    const studentsWithPending = new Set<string>();

    for (const period of allBillingPeriods) {
      if (period.outstanding > 0) {
        pendingFees += period.outstanding;
        studentsWithPending.add(period.studentId);
      }
    }

    // Expected income is defined as sum of outstanding balances for active billing periods
    const expectedIncome = Math.round(pendingFees * 100) / 100;

    return {
      lifetimeIncome: Number(lifetimeAgg._sum.amount || 0),
      todayIncome: Number(todayAgg._sum.amount || 0),
      currentMonthIncome: Number(thisMonthAgg._sum.amount || 0),
      previousMonthIncome: Number(prevMonthAgg._sum.amount || 0),
      currentYearIncome: Number(thisYearAgg._sum.amount || 0),
      pendingFees: Math.round(pendingFees * 100) / 100,
      pendingStudentCount: studentsWithPending.size,
      expectedIncome,
      activeStudents: activeStudentsCount,
    };
  }

  /**
   * Retrieves full Income overview for /developer/income
   */
  static async getIncomeOverview(filters: IncomeFilters = {}): Promise<DeveloperIncomeOverview> {
    const range = TimezoneUtils.getDateRange(
      filters.preset || 'this_month',
      filters.startDate,
      filters.endDate
    );

    const stats = await this.getDeveloperDashboardStats();

    // Query filtered payments for the date range
    const paymentWhere: any = {
      paymentDate: {
        gte: range.startDate,
        lte: range.endDate,
      },
    };

    if (filters.method) {
      paymentWhere.paymentMethod = filters.method;
    }

    if (filters.shift || filters.locker) {
      paymentWhere.billingPeriod = {};
      if (filters.shift) {
        paymentWhere.billingPeriod.OR = [
          { shiftSnapshot: filters.shift },
          { shiftSnapshot: null, student: { shift: filters.shift } },
        ];
      }
      if (filters.locker) {
        paymentWhere.billingPeriod.AND = paymentWhere.billingPeriod.AND || [];
        paymentWhere.billingPeriod.AND.push({
          OR: [
            { lockerSnapshot: filters.locker },
            { lockerSnapshot: null, student: { locker: filters.locker } },
          ],
        });
      }
    }

    const payments = await prisma.payment.findMany({
      where: paymentWhere,
      orderBy: { paymentDate: 'asc' },
      include: {
        student: {
          include: {
            assignments: { where: { isCurrent: true }, include: { seat: true } },
          },
        },
        billingPeriod: true,
      },
    });

    const rangeIncome = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const rangePaymentCount = payments.length;

    // Build Trend Points (Daily, Weekly, or Monthly)
    const trendMap = new Map<string, { label: string; date: string; amount: number; count: number }>();

    // Determine interval automatically if not explicitly given
    const diffDays = Math.ceil((range.endDate.getTime() - range.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const interval = filters.interval || (diffDays <= 31 ? 'daily' : diffDays <= 120 ? 'weekly' : 'monthly');

    for (const p of payments) {
      const pDate = new Date(p.paymentDate);
      const istDateStr = TimezoneUtils.formatToIstDateString(pDate);
      let key = istDateStr;
      let label = TimezoneUtils.formatToIstDisplay(pDate);

      if (interval === 'monthly') {
        const cal = BillingDateUtils.parseCalendarDate(pDate);
        key = `${cal.year}-${String(cal.month).padStart(2, '0')}`;
        label = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(pDate);
      } else if (interval === 'weekly') {
        // Group by week starting Monday
        const cal = BillingDateUtils.parseCalendarDate(pDate);
        key = `W-${cal.year}-${Math.floor(cal.day / 7)}`;
        label = `Week of ${cal.day}/${cal.month}`;
      }

      const existing = trendMap.get(key) || { label, date: istDateStr, amount: 0, count: 0 };
      existing.amount += Number(p.amount);
      existing.count += 1;
      trendMap.set(key, existing);
    }

    const trend: IncomeTrendPoint[] = Array.from(trendMap.entries()).map(([_key, val]) => ({
      label: val.label,
      date: val.date,
      amount: Math.round(val.amount * 100) / 100,
      count: val.count,
    }));

    // Payment Method Breakdown
    const methodMap = new Map<PaymentMethod, { amount: number; count: number }>([
      [PaymentMethod.CASH, { amount: 0, count: 0 }],
      [PaymentMethod.UPI, { amount: 0, count: 0 }],
      [PaymentMethod.OTHER, { amount: 0, count: 0 }],
    ]);

    for (const p of payments) {
      const m = p.paymentMethod as PaymentMethod;
      const cur = methodMap.get(m) || { amount: 0, count: 0 };
      cur.amount += Number(p.amount);
      cur.count += 1;
      methodMap.set(m, cur);
    }

    const paymentMethodBreakdown: PaymentMethodBreakdownItem[] = Array.from(methodMap.entries()).map(
      ([method, data]) => ({
        method,
        amount: Math.round(data.amount * 100) / 100,
        percentage: rangeIncome > 0 ? Math.round((data.amount / rangeIncome) * 1000) / 10 : 0,
        count: data.count,
      })
    );

    // Shift Income Breakdown (Historical snapshot preserved)
    const shiftMap = new Map<Shift, { amount: number; count: number }>([
      [Shift.MORNING, { amount: 0, count: 0 }],
      [Shift.EVENING, { amount: 0, count: 0 }],
      [Shift.FULL_DAY, { amount: 0, count: 0 }],
    ]);

    for (const p of payments) {
      const shift = (p.billingPeriod.shiftSnapshot || p.student.shift) as Shift;
      const cur = shiftMap.get(shift) || { amount: 0, count: 0 };
      cur.amount += Number(p.amount);
      cur.count += 1;
      shiftMap.set(shift, cur);
    }

    const shiftIncome: ShiftIncomeItem[] = Array.from(shiftMap.entries()).map(([shift, data]) => ({
      shift,
      amount: Math.round(data.amount * 100) / 100,
      percentage: rangeIncome > 0 ? Math.round((data.amount / rangeIncome) * 1000) / 10 : 0,
      count: data.count,
    }));

    // Locker Income Breakdown
    const lockerMap = new Map<Locker, { amount: number; count: number }>([
      [Locker.WITH_LOCKER, { amount: 0, count: 0 }],
      [Locker.WITHOUT_LOCKER, { amount: 0, count: 0 }],
    ]);

    for (const p of payments) {
      const locker = (p.billingPeriod.lockerSnapshot || p.student.locker) as Locker;
      const cur = lockerMap.get(locker) || { amount: 0, count: 0 };
      cur.amount += Number(p.amount);
      cur.count += 1;
      lockerMap.set(locker, cur);
    }

    const lockerIncome: LockerIncomeItem[] = Array.from(lockerMap.entries()).map(
      ([locker, data]) => ({
        locker,
        amount: Math.round(data.amount * 100) / 100,
        percentage: rangeIncome > 0 ? Math.round((data.amount / rangeIncome) * 1000) / 10 : 0,
        count: data.count,
      })
    );

    // Recent Payments (top 15 newest in date range)
    const recentPaymentsRaw = [...payments].sort(
      (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    ).slice(0, 15);

    const recentPayments: PaymentDto[] = recentPaymentsRaw.map((p) => {
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

    return {
      summary: {
        lifetimeIncome: stats.lifetimeIncome,
        todayIncome: stats.todayIncome,
        currentMonthIncome: stats.currentMonthIncome,
        previousMonthIncome: stats.previousMonthIncome,
        currentYearIncome: stats.currentYearIncome,
        rangeIncome: Math.round(rangeIncome * 100) / 100,
        rangePaymentCount,
      },
      trend,
      paymentMethodBreakdown,
      shiftIncome,
      lockerIncome,
      recentPayments,
    };
  }
}
