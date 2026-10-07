export const Role = {
  OWNER: 'OWNER',
  DEVELOPER: 'DEVELOPER',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Shift = {
  MORNING: 'MORNING',
  EVENING: 'EVENING',
  FULL_DAY: 'FULL_DAY',
} as const;
export type Shift = (typeof Shift)[keyof typeof Shift];

export const Locker = {
  WITH_LOCKER: 'WITH_LOCKER',
  WITHOUT_LOCKER: 'WITHOUT_LOCKER',
} as const;
export type Locker = (typeof Locker)[keyof typeof Locker];

export const StudentStatus = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type StudentStatus = (typeof StudentStatus)[keyof typeof StudentStatus];

export const SeatStatus = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
} as const;
export type SeatStatus = (typeof SeatStatus)[keyof typeof SeatStatus];

export const BillingStatus = {
  PENDING: 'PENDING',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;
export type BillingStatus = (typeof BillingStatus)[keyof typeof BillingStatus];

export const PaymentMethod = {
  CASH: 'CASH',
  UPI: 'UPI',
  OTHER: 'OTHER',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

// Dynamic Fee Status calculated for Owner UI
export const UserFacingFeeStatus = {
  PAID: 'PAID',
  DUE_SOON: 'DUE_SOON',
  DUE: 'DUE',
  OVERDUE: 'OVERDUE',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
} as const;
export type UserFacingFeeStatus = (typeof UserFacingFeeStatus)[keyof typeof UserFacingFeeStatus];

export interface SafeUser {
  id: string;
  username: string;
  role: Role;
  name?: string | null;
  mobile?: string | null;
  email?: string | null;
  profilePhotoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: Role;
}

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface LoginResponseData {
  user: SafeUser;
  token: string;
}

export interface SeatWithStudent {
  id: string;
  seatNumber: number;
  status: SeatStatus;
  currentStudent?: {
    id: string;
    name: string;
    mobile: string;
    photoUrl?: string | null;
    shift: Shift;
    locker: Locker;
    admissionDate: string;
    feeCycleStartDate: string;
    monthlyFee: number;
    assignedAt: string;
  } | null;
}

export interface SeatAssignmentHistory {
  id: string;
  seatNumber: number;
  assignedAt: string;
  vacatedAt?: string | null;
  isCurrent: boolean;
}

export interface StudentWithSeat {
  id: string;
  name: string;
  mobile: string;
  photoUrl?: string | null;
  shift: Shift;
  locker: Locker;
  admissionDate: string;
  feeCycleStartDate: string;
  monthlyFee: number;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  currentSeat?: {
    id: string;
    seatNumber: number;
    assignedAt: string;
  } | null;
  seatHistory?: SeatAssignmentHistory[];
}

export interface OwnerDashboardStats {
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  activeStudents: number;
  archivedStudents: number;
  // Prompt 3 additions:
  feesDueSoon: number;
  feesDue: number;
  feesOverdue: number;
  collectedThisPeriod: number;
}

export interface PaymentDto {
  id: string;
  receiptNumber: string;
  studentId: string;
  billingPeriodId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference?: string | null;
  note?: string | null;
  createdAt: string;
  studentName?: string;
  seatNumber?: number | null;
}

export interface BillingPeriodWithPayments {
  id: string;
  studentId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  outstanding: number;
  status: UserFacingFeeStatus;
  daysRemaining: number;
  student?: {
    id: string;
    name: string;
    mobile: string;
    photoUrl?: string | null;
    seatNumber?: number | null;
  };
  payments: PaymentDto[];
}

export interface FeeReminderItem {
  studentId: string;
  studentName: string;
  mobile: string;
  seatNumber: number | null;
  billingPeriodId: string;
  amount: number;
  paidAmount: number;
  outstanding: number;
  dueDate: string;
  daysRemaining: number;
  status: UserFacingFeeStatus;
}

// Developer Analytics & Reports Types
export interface DeveloperDashboardStats {
  lifetimeIncome: number;
  todayIncome: number;
  currentMonthIncome: number;
  previousMonthIncome: number;
  currentYearIncome: number;
  pendingFees: number;
  pendingStudentCount: number;
  expectedIncome: number;
  activeStudents: number;
}

export interface IncomeTrendPoint {
  label: string; // e.g., '2026-10-01' or 'Jan 2026'
  date: string;
  amount: number;
  count: number;
}

export interface PaymentMethodBreakdownItem {
  method: PaymentMethod;
  amount: number;
  percentage: number;
  count: number;
}

export interface ShiftIncomeItem {
  shift: Shift;
  amount: number;
  percentage: number;
  count: number;
}

export interface LockerIncomeItem {
  locker: Locker;
  amount: number;
  percentage: number;
  count: number;
}

export interface DeveloperIncomeOverview {
  summary: {
    lifetimeIncome: number;
    todayIncome: number;
    currentMonthIncome: number;
    previousMonthIncome: number;
    currentYearIncome: number;
    rangeIncome: number;
    rangePaymentCount: number;
  };
  trend: IncomeTrendPoint[];
  paymentMethodBreakdown: PaymentMethodBreakdownItem[];
  shiftIncome: ShiftIncomeItem[];
  lockerIncome: LockerIncomeItem[];
  recentPayments: PaymentDto[];
}

export interface IncomeReportRow {
  paymentId: string;
  receiptNumber: string;
  paymentDate: string;
  studentName: string;
  seatNumber: number | null;
  shift: Shift;
  locker: Locker;
  billingPeriod: string; // e.g. "12 Sep 2026 - 11 Oct 2026"
  amount: number;
  paymentMethod: PaymentMethod;
  reference: string | null;
}

export interface PendingFeeReportRow {
  studentId: string;
  studentName: string;
  seatNumber: number | null;
  mobile: string;
  billingPeriodId: string;
  billingPeriod: string;
  amount: number;
  paid: number;
  outstanding: number;
  dueDate: string;
  status: UserFacingFeeStatus;
  daysOverdue: number;
}

export interface StudentReportRow {
  studentId: string;
  name: string;
  seatNumber: number | null;
  mobile: string;
  shift: Shift;
  locker: Locker;
  admissionDate: string;
  feeCycleStartDate: string;
  monthlyFee: number;
  status: StudentStatus;
}

export interface SeatOccupancyReportRow {
  seatNumber: number;
  status: SeatStatus;
  studentName: string | null;
  studentMobile: string | null;
  assignedDate: string | null;
}

export interface AdmissionsReportRow {
  studentId: string;
  admissionDate: string;
  feeCycleStartDate: string;
  studentName: string;
  seatNumber: number | null;
  shift: Shift;
  locker: Locker;
  monthlyFee: number;
  status: StudentStatus;
}

export interface ShiftReportRow {
  shift: Shift;
  activeStudents: number;
  occupiedSeats: number;
  income: number;
  outstandingFees: number;
}

export interface LockerReportRow {
  locker: Locker;
  studentCount: number;
  percentage: number;
  income: number;
  outstandingFees: number;
}

export interface MonthlySummaryRow {
  month: string; // e.g. "January 2026"
  year: number;
  monthIndex: number;
  collectedIncome: number;
  paymentCount: number;
  pendingAmount: number;
  activeStudents: number;
  newAdmissions: number;
}

export interface ActivityLogRow {
  id: string;
  timestamp: string;
  userId: string | null;
  username: string | null;
  userRole: Role | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  studentId: string | null;
  studentName: string | null;
  metadata: any | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface DataIntegrityIssue {
  id: string;
  category: string;
  severity: 'PASS' | 'WARNING' | 'ERROR';
  description: string;
  details?: any;
}

export interface DataIntegrityReport {
  overallStatus: 'PASS' | 'WARNING' | 'ERROR';
  checkedAt: string;
  totalChecks: number;
  issues: DataIntegrityIssue[];
}

export interface SystemInfoData {
  application: string;
  environment: string;
  database: {
    status: 'Connected' | 'Error';
    responseTimeMs?: number;
  };
  backend: {
    status: 'Healthy' | 'Degraded';
    uptimeSeconds: number;
    nodeVersion: string;
  };
  counts: {
    totalSeats: number;
    occupiedSeats: number;
    activeStudents: number;
    archivedStudents: number;
    paymentRecords: number;
    billingPeriods: number;
    activityLogs: number;
  };
  timezone: string;
  lastChecked: string;
}

