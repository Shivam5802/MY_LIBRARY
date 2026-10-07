import { prisma } from '../config/prisma.js';
import { BillingService } from './billing.service.js';
import { TimezoneUtils } from '../utils/timezone.js';
import { BillingDateUtils } from '../utils/billing-date.js';
import {
  IncomeReportRow,
  PendingFeeReportRow,
  StudentReportRow,
  SeatOccupancyReportRow,
  AdmissionsReportRow,
  ShiftReportRow,
  LockerReportRow,
  MonthlySummaryRow,
  Shift,
  Locker,
  PaymentMethod,
  StudentStatus,
  SeatStatus,
  UserFacingFeeStatus,
} from '../types/index.js';

export interface ReportFilterOptions {
  preset?: string;
  startDate?: string;
  endDate?: string;
  shift?: Shift;
  locker?: Locker;
  paymentMethod?: PaymentMethod;
  status?: string;
  year?: number;
}

export class ReportsService {
  /**
   * 1. Income Report
   */
  static async getIncomeReport(filters: ReportFilterOptions = {}): Promise<{
    rows: IncomeReportRow[];
    totalPayments: number;
    totalIncome: number;
  }> {
    const range = TimezoneUtils.getDateRange(
      filters.preset || 'this_month',
      filters.startDate,
      filters.endDate
    );

    const where: any = {
      paymentDate: {
        gte: range.startDate,
        lte: range.endDate,
      },
    };

    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters.shift || filters.locker) {
      where.billingPeriod = {};
      if (filters.shift) {
        where.billingPeriod.OR = [
          { shiftSnapshot: filters.shift },
          { shiftSnapshot: null, student: { shift: filters.shift } },
        ];
      }
      if (filters.locker) {
        where.billingPeriod.AND = where.billingPeriod.AND || [];
        where.billingPeriod.AND.push({
          OR: [
            { lockerSnapshot: filters.locker },
            { lockerSnapshot: null, student: { locker: filters.locker } },
          ],
        });
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      include: {
        student: {
          include: {
            assignments: { where: { isCurrent: true }, include: { seat: true } },
          },
        },
        billingPeriod: true,
      },
    });

    let totalIncome = 0;
    const rows: IncomeReportRow[] = payments.map((p) => {
      const amt = Number(p.amount);
      totalIncome += amt;
      const currentSeat = p.student.assignments.find((a) => a.isCurrent);
      const shift = (p.billingPeriod.shiftSnapshot || p.student.shift) as Shift;
      const locker = (p.billingPeriod.lockerSnapshot || p.student.locker) as Locker;

      const pStart = TimezoneUtils.formatToIstDisplay(p.billingPeriod.periodStart);
      const pEnd = TimezoneUtils.formatToIstDisplay(p.billingPeriod.periodEnd);

      return {
        paymentId: p.id,
        receiptNumber: p.receiptNumber,
        paymentDate: p.paymentDate.toISOString(),
        studentName: p.student.name,
        seatNumber: currentSeat?.seat?.seatNumber ?? null,
        shift,
        locker,
        billingPeriod: `${pStart} - ${pEnd}`,
        amount: amt,
        paymentMethod: p.paymentMethod as PaymentMethod,
        reference: p.reference,
      };
    });

    return {
      rows,
      totalPayments: rows.length,
      totalIncome: Math.round(totalIncome * 100) / 100,
    };
  }

  /**
   * 2. Pending Fee Report
   */
  static async getPendingFeeReport(filters: ReportFilterOptions = {}): Promise<{
    rows: PendingFeeReportRow[];
    totalOutstanding: number;
    studentsWithOutstanding: number;
  }> {
    const allPeriods = await BillingService.getAllBillingPeriods({
      shift: filters.shift,
      locker: filters.locker,
    });

    let filtered = allPeriods.filter((p) => p.outstanding > 0);

    if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter((p) => p.status === filters.status);
    }

    const studentIds = new Set<string>();
    let totalOutstanding = 0;

    const rows: PendingFeeReportRow[] = filtered.map((p) => {
      totalOutstanding += p.outstanding;
      studentIds.add(p.studentId);

      const daysOverdue =
        p.status === UserFacingFeeStatus.OVERDUE
          ? Math.max(0, -p.daysRemaining)
          : 0;

      const pStart = TimezoneUtils.formatToIstDisplay(p.periodStart);
      const pEnd = TimezoneUtils.formatToIstDisplay(p.periodEnd);

      return {
        studentId: p.studentId,
        studentName: p.student?.name || 'Unknown',
        seatNumber: p.student?.seatNumber ?? null,
        mobile: p.student?.mobile || '',
        billingPeriodId: p.id,
        billingPeriod: `${pStart} - ${pEnd}`,
        amount: p.amount,
        paid: p.paidAmount,
        outstanding: p.outstanding,
        dueDate: p.dueDate,
        status: p.status,
        daysOverdue,
      };
    });

    return {
      rows,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      studentsWithOutstanding: studentIds.size,
    };
  }

  /**
   * 3. Student Report
   */
  static async getStudentReport(filters: ReportFilterOptions = {}): Promise<{
    rows: StudentReportRow[];
    totalCount: number;
  }> {
    const where: any = {};
    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }
    if (filters.shift) {
      where.shift = filters.shift;
    }
    if (filters.locker) {
      where.locker = filters.locker;
    }

    const students = await prisma.student.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        assignments: { where: { isCurrent: true }, include: { seat: true } },
      },
    });

    const rows: StudentReportRow[] = students.map((s) => {
      const currentSeat = s.assignments.find((a) => a.isCurrent);
      return {
        studentId: s.id,
        name: s.name,
        seatNumber: currentSeat?.seat?.seatNumber ?? null,
        mobile: s.mobile,
        shift: s.shift as Shift,
        locker: s.locker as Locker,
        admissionDate: s.admissionDate.toISOString(),
        monthlyFee: Number(s.monthlyFee),
        status: s.status as StudentStatus,
      };
    });

    return {
      rows,
      totalCount: rows.length,
    };
  }

  /**
   * 4. Seat Occupancy Report (92 seats)
   */
  static async getSeatOccupancyReport(): Promise<{
    totalSeats: number;
    occupiedSeats: number;
    availableSeats: number;
    occupancyPercentage: number;
    rows: SeatOccupancyReportRow[];
  }> {
    const seats = await prisma.seat.findMany({
      orderBy: { seatNumber: 'asc' },
      include: {
        assignments: {
          where: { isCurrent: true },
          include: { student: true },
        },
      },
    });

    let occupiedSeats = 0;
    const rows: SeatOccupancyReportRow[] = seats.map((seat) => {
      const currentAssign = seat.assignments[0];
      const student = currentAssign?.student;
      const isOccupied = seat.status === SeatStatus.OCCUPIED || Boolean(currentAssign);

      if (isOccupied) occupiedSeats++;

      return {
        seatNumber: seat.seatNumber,
        status: isOccupied ? SeatStatus.OCCUPIED : SeatStatus.AVAILABLE,
        studentName: student?.name || null,
        studentMobile: student?.mobile || null,
        assignedDate: currentAssign?.assignedAt?.toISOString() || null,
      };
    });

    const totalSeats = 92;
    const availableSeats = Math.max(0, totalSeats - occupiedSeats);
    const occupancyPercentage = Math.round((occupiedSeats / totalSeats) * 1000) / 10;

    return {
      totalSeats,
      occupiedSeats,
      availableSeats,
      occupancyPercentage,
      rows,
    };
  }

  /**
   * 5. Admissions Report
   */
  static async getAdmissionsReport(filters: ReportFilterOptions = {}): Promise<{
    rows: AdmissionsReportRow[];
    totalAdmissions: number;
  }> {
    const range = TimezoneUtils.getDateRange(
      filters.preset || 'this_year',
      filters.startDate,
      filters.endDate
    );

    const students = await prisma.student.findMany({
      where: {
        admissionDate: {
          gte: range.startDate,
          lte: range.endDate,
        },
      },
      orderBy: { admissionDate: 'desc' },
      include: {
        assignments: { where: { isCurrent: true }, include: { seat: true } },
      },
    });

    const rows: AdmissionsReportRow[] = students.map((s) => {
      const currentSeat = s.assignments.find((a) => a.isCurrent);
      return {
        studentId: s.id,
        admissionDate: s.admissionDate.toISOString(),
        studentName: s.name,
        seatNumber: currentSeat?.seat?.seatNumber ?? null,
        shift: s.shift as Shift,
        locker: s.locker as Locker,
        monthlyFee: Number(s.monthlyFee),
        status: s.status as StudentStatus,
      };
    });

    return {
      rows,
      totalAdmissions: rows.length,
    };
  }

  /**
   * 6. Shift Report
   */
  static async getShiftReport(): Promise<{ rows: ShiftReportRow[] }> {
    const shifts: Shift[] = [Shift.MORNING, Shift.EVENING, Shift.FULL_DAY];
    const allPeriods = await BillingService.getAllBillingPeriods();

    const rows: ShiftReportRow[] = [];

    for (const shift of shifts) {
      const activeStudents = await prisma.student.count({
        where: { shift, status: 'ACTIVE' },
      });

      const occupiedSeats = await prisma.seat.count({
        where: {
          status: 'OCCUPIED',
          assignments: {
            some: { isCurrent: true, student: { shift } },
          },
        },
      });

      // Income from payments for this shift
      const payments = await prisma.payment.findMany({
        where: {
          OR: [
            { billingPeriod: { shiftSnapshot: shift } },
            { billingPeriod: { shiftSnapshot: null }, student: { shift } },
          ],
        },
        select: { amount: true },
      });
      const income = payments.reduce((sum, p) => sum + Number(p.amount), 0);

      // Outstanding fees
      const outstandingFees = allPeriods
        .filter((p) => (p.student ? true : false))
        .filter((p) => {
          // Check student shift
          return (p as any).shift === shift || (p.student as any)?.shift === shift;
        })
        .reduce((sum, p) => sum + p.outstanding, 0);

      rows.push({
        shift,
        activeStudents,
        occupiedSeats,
        income: Math.round(income * 100) / 100,
        outstandingFees: Math.round(outstandingFees * 100) / 100,
      });
    }

    return { rows };
  }

  /**
   * 7. Locker Report
   */
  static async getLockerReport(): Promise<{ rows: LockerReportRow[] }> {
    const lockers: Locker[] = [Locker.WITH_LOCKER, Locker.WITHOUT_LOCKER];
    const totalActive = await prisma.student.count({ where: { status: 'ACTIVE' } });
    const allPeriods = await BillingService.getAllBillingPeriods();

    const rows: LockerReportRow[] = [];

    for (const locker of lockers) {
      const studentCount = await prisma.student.count({
        where: { locker, status: 'ACTIVE' },
      });

      const percentage = totalActive > 0 ? Math.round((studentCount / totalActive) * 1000) / 10 : 0;

      const payments = await prisma.payment.findMany({
        where: {
          OR: [
            { billingPeriod: { lockerSnapshot: locker } },
            { billingPeriod: { lockerSnapshot: null }, student: { locker } },
          ],
        },
        select: { amount: true },
      });
      const income = payments.reduce((sum, p) => sum + Number(p.amount), 0);

      const outstandingFees = allPeriods
        .filter((p) => (p as any).locker === locker || (p.student as any)?.locker === locker)
        .reduce((sum, p) => sum + p.outstanding, 0);

      rows.push({
        locker,
        studentCount,
        percentage,
        income: Math.round(income * 100) / 100,
        outstandingFees: Math.round(outstandingFees * 100) / 100,
      });
    }

    return { rows };
  }

  /**
   * 8. Monthly Summary
   */
  static async getMonthlySummary(year?: number): Promise<{ rows: MonthlySummaryRow[]; year: number }> {
    const targetYear = year || TimezoneUtils.getTodayCalendarDate().year;
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const allPayments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0)),
          lte: new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59)),
        },
      },
    });

    const allAdmissions = await prisma.student.findMany({
      where: {
        admissionDate: {
          gte: new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0)),
          lte: new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59)),
        },
      },
    });

    const allPeriods = await BillingService.getAllBillingPeriods();
    const activeStudentsNow = await prisma.student.count({ where: { status: 'ACTIVE' } });

    const rows: MonthlySummaryRow[] = [];

    for (let m = 1; m <= 12; m++) {
      const monthStart = TimezoneUtils.istCalendarDateToUtcStart({ year: targetYear, month: m, day: 1 });
      const maxDays = BillingDateUtils.getDaysInMonth(targetYear, m);
      const monthEnd = TimezoneUtils.istCalendarDateToUtcEnd({ year: targetYear, month: m, day: maxDays });

      const monthPayments = allPayments.filter((p) => {
        const t = new Date(p.paymentDate).getTime();
        return t >= monthStart.getTime() && t <= monthEnd.getTime();
      });

      const collectedIncome = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      const newAdmissions = allAdmissions.filter((s) => {
        const t = new Date(s.admissionDate).getTime();
        return t >= monthStart.getTime() && t <= monthEnd.getTime();
      }).length;

      // Pending amount for periods ending in this month
      const monthPeriods = allPeriods.filter((p) => {
        const t = new Date(p.periodEnd).getTime();
        return t >= monthStart.getTime() && t <= monthEnd.getTime();
      });
      const pendingAmount = monthPeriods.reduce((sum, p) => sum + p.outstanding, 0);

      rows.push({
        month: `${months[m - 1]} ${targetYear}`,
        year: targetYear,
        monthIndex: m,
        collectedIncome: Math.round(collectedIncome * 100) / 100,
        paymentCount: monthPayments.length,
        pendingAmount: Math.round(pendingAmount * 100) / 100,
        activeStudents: activeStudentsNow,
        newAdmissions,
      });
    }

    return { rows, year: targetYear };
  }
}
