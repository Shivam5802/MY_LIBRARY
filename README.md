# MY LIBRARY — Digital Management System

A production-ready digital library and physical study hall management system built for exactly **92 seats**.

---

## 1. Project Overview

**MY LIBRARY** manages desk seat allocations, student admissions, recurring fee billing cycles tied to individual admission dates, reminders, and administrative operations.

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT Authentication.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, Lucide React icons.

---

## 2. Core Architectural & Business Rules

### 1. Admission-Date Recurring Billing (Critical Rule)
- **BILLING IS NOT BASED ON THE CALENDAR MONTH**.
- Every student's monthly fee cycle anchors to their individual **`admissionDate`**.
- Cycle spans from day `D` of month `M1` to `D-1` of month `M2` (e.g. 12 Sep → 11 Oct, 12 Oct → 11 Nov).
- **Month-End Edge Cases**:
  - Admissions on the 28th, 29th, 30th, or 31st clip to the last valid calendar day of shorter months (e.g., 31 Jan admission in a non-leap year yields 31 Jan → 27 Feb, followed by 28 Feb → 30 Mar).
  - Timezone calculations are normalized to `Asia/Kolkata` using calendar dates (`YYYY-MM-DD`) without UTC drift.

### 2. 5-Day Reminder Rule
- When an active student has **5 days or fewer remaining** in their current billing period (or is on due date / overdue), they automatically trigger reminder status:
  - `> 5 days remaining`: `DUE`
  - `1 to 5 days remaining`: `DUE_SOON`
  - `0 days remaining`: `DUE`
  - `< 0 days remaining`: `OVERDUE`
  - Fully paid: `PAID`
  - Outstanding balance with payment: `PARTIALLY_PAID`

### 3. Payment Processing & Monetary Precision
- Handled with exact database Decimal representations (`Decimal(10, 2)`).
- **No Overpayments**: `PaymentService` enforces `amount <= outstanding` inside database transactions.
- Partial payments cleanly update cycle status to `PARTIALLY_PAID` and reduce outstanding balances.
- Each payment generates a unique sequential receipt number: `RCP-YYYYMMDD-XXXX`.

### 4. WhatsApp Click-to-Chat Reminders
- Opens WhatsApp Web or mobile app (`https://wa.me/+91XXXXXXXXXX?text=...`).
- Safely formats Indian 10-digit numbers into standard international format (`+91XXXXXXXXXX`).
- Customizable message template in Owner Settings supporting tokens: `{name}`, `{amount}`, `{dueDate}`, `{seat}`, `{libraryName}`.

---

## 3. Folder Structure

```
MY-LIBRARY/
├── backend/
│   ├── prisma/
│   │   ├── migrations/         # PostgreSQL database migrations
│   │   ├── schema.prisma       # Prisma schema (User, Seat, Student, StudentSeatAssignment, BillingPeriod, Payment, SystemSetting, ActivityLog)
│   │   └── seed.ts             # Idempotent seeder: roles, accounts & seats 1–92
│   ├── src/
│   │   ├── config/             # Environment validation & Prisma singleton
│   │   ├── controllers/        # Express controllers (auth, health, seat, student, dashboard, profile, billing)
│   │   ├── middleware/         # Auth, RBAC, Zod validation, error handling
│   │   ├── routes/             # Versioned express routes (/api/v1)
│   │   ├── services/           # Services (auth, seat, student, dashboard, profile, billing, payment, fee-status, whatsapp)
│   │   ├── types/              # Backend TypeScript interfaces and enums
│   │   ├── utils/              # billing-date engine, bcrypt hashing, JWT helpers, standard response builders
│   │   ├── app.ts              # Express configuration & CORS
│   │   └── server.ts           # HTTP server bootstrapping
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # SeatGrid, SeatDetailsDrawer, StudentForm, StatCard, ImageUpload, ConfirmDialog, RecordPaymentModal, WhatsAppReminderModal
│   │   ├── context/            # AuthContext (persistent JWT session)
│   │   ├── layouts/            # OwnerLayout (Desktop sidebar & Mobile bottom navigation)
│   │   ├── pages/              # OwnerDashboardPage, SeatsPage, StudentsListPage, PaymentsPage, AddStudentPage, StudentProfilePage, OwnerProfilePage, ReportsPlaceholderPage, LoginPage, DeveloperPlaceholderPage, UnauthorizedPage
│   │   ├── routes/             # ProtectedRoute wrapper
│   │   ├── services/           # API client, auth service, seat service, student service, billing service, dashboard/profile service
│   │   ├── types/              # Frontend TypeScript definitions
│   │   ├── App.tsx             # Application routing
│   │   ├── index.css           # Tailwind base styles
│   │   └── main.tsx            # Vite entry point
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── .gitignore
└── README.md
```

---

## 4. Getting Started & Installation

### Setup Database & Backend
1. Ensure PostgreSQL is active on `localhost:5432`.
2. Configure environment:
   ```bash
   cd backend
   cp .env.example .env
   ```
3. Run migrations and seed seats 1–92:
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate dev
   npm run prisma:seed
   ```
4. Start backend server:
   ```bash
   npm run dev
   # Runs on http://localhost:5000/api/v1
   ```

### Setup Frontend
1. Start frontend development server:
   ```bash
   cd frontend
   npm install
   npm run dev
   # Application opens at http://localhost:5173
   ```

---

## 5. Seed Credentials

- **Owner**: `owner` / `OwnerPassword123!`
- **Developer**: `developer` / `DeveloperPassword123!`

---

## 6. Prompt 3 API Endpoints

All operational billing routes require `OWNER` role authorization:

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/v1/billing/periods` | Filterable list of billing periods and status |
| `GET` | `/api/v1/billing/students/:id/current` | Current cycle details for student with days remaining |
| `GET` | `/api/v1/billing/students/:id/history` | Chronological billing cycles and payments for student |
| `GET` | `/api/v1/billing/payments` | Payment receipts register |
| `POST` | `/api/v1/billing/payments` | Record payment transactionally (prevents overpayment) |
| `PATCH` | `/api/v1/billing/payments/:id` | Edit payment details and recalculate balances |
| `GET` | `/api/v1/billing/reminders` | Students with fees due within 5 days or overdue |
| `GET` | `/api/v1/billing/whatsapp/prepare` | Prepares WhatsApp encoded message & link |
| `GET` | `/api/v1/billing/settings/reminder-template` | Get customizable WhatsApp reminder message |
| `PATCH` | `/api/v1/billing/settings/reminder-template` | Update customizable WhatsApp reminder message |

---

## 7. Developer Administration & Financial Reporting System (Prompt 4)

### Role Authorization & Security Model
- **Strict Role Separation**: There are exactly two roles in the system: `OWNER` and `DEVELOPER`.
- **Mandatory Backend Enforcement**:
  - The `OWNER` role **MUST NOT** have access to the developer's full income reports, advanced analytics, audit logs, or system integrity diagnostics.
  - When an authenticated user with `role: "OWNER"` calls any developer-only endpoint (`/api/v1/developer/*`), the backend returns an immediate **`403 Forbidden`** response.
  - Frontend developer navigation and routes are completely hidden and guarded from the `OWNER`.
  - Unauthenticated requests receive **`401 Unauthorized`**.
  - Passwords, hashes, and secrets (`DATABASE_URL`, `JWT_SECRET`, private keys) are never exposed.

### Financial Definitions & Formulas
1. **Primary Income**: Sum of all successfully recorded payments (`SUM(Payment.amount)`). Unpaid invoices, pending fees, expected future billing, and cancelled payments are never counted as collected income.
2. **Today's Income**: Payments whose `paymentDate` falls on today's business date within **Asia/Kolkata** (IST: UTC +05:30).
3. **Current Month Income**: Payments recorded from day 1 of the current calendar month in Asia/Kolkata through today.
4. **Previous Month Income**: Payments recorded across the entire previous calendar month in Asia/Kolkata.
5. **Current Year Income**: Payments recorded from January 1 through the current date.
6. **Lifetime Income**: Cumulative sum of all valid payment records in the database.
7. **Pending Fees**: Monetary sum of outstanding balances (`billingPeriod.amount - valid payments`) for active billing cycles.
8. **Expected Income**: Sum of outstanding balances for active billing cycles.
9. **Historical Accuracy**: Billing periods store snapshot data (`shiftSnapshot`, `lockerSnapshot`) so changes to a student's profile never alter historical financial reporting.

### Developer API Endpoints (DEVELOPER Role Only)
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/v1/developer/dashboard` | 8 summary metrics: Lifetime, Today, Current Month, Prev Month, Current Year, Pending, Expected, Active Students |
| `GET` | `/api/v1/developer/income` | Full income overview: Trend chart, payment methods, shift & locker breakdowns, recent payments |
| `GET` | `/api/v1/developer/payments/:id` | Detailed safe payment transaction inspection |
| `GET` | `/api/v1/developer/reports/:category` | 10 categories: income, pending-fees, students, seats, admissions, shift, locker, monthly-summary |
| `GET` | `/api/v1/developer/reports/:category/export` | Server-generated complete exports (`?format=csv\|xlsx\|pdf`) respecting active filters |
| `GET` | `/api/v1/developer/activity` | Centralized audit logs with search and filters |
| `GET` | `/api/v1/developer/system` | System architecture, runtime uptime, entity counts, health telemetry |
| `GET` | `/api/v1/developer/system/integrity` | 9-point non-destructive diagnostic invariant suite |
| `GET` | `/api/v1/developer/profile` | Developer profile details |
| `PATCH` | `/api/v1/developer/profile` | Update developer contact details (role modification is blocked) |
| `PATCH` | `/api/v1/developer/password` | Change developer password |

### Export Center
- **CSV**: UTF-8 encoded with BOM, formatted Indian currency and dates.
- **Excel (.xlsx)**: Multi-sheet workbook (`exceljs`) containing formatted report data and Executive Summary tab.
- **PDF**: Printable landscape reports (`pdfkit`) with headers, summary metrics, and data tables.

### Data Integrity Diagnostic Suite (9-Point Non-Destructive Checks)
1. Missing seat numbers in range 1–92.
2. Multiple active student assignments for a single seat.
3. Seat marked `OCCUPIED` without an active assignment.
4. Seat marked `AVAILABLE` with an active assignment.
5. Single student assigned to multiple seats simultaneously.
6. Duplicate billing periods for same student and start date.
7. Payment amount exceeding billed fee balance.
8. Invalid billing period dates (`periodStart >= periodEnd`).
9. Orphan payments with broken student relationships.

---

## 8. Production Readiness & Security Hardening (Prompt 5)

### Security & Reliability Features
- **Helmet Security Headers**: Hardened HTTP response headers (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, etc.) preventing clickjacking and MIME-sniffing.
- **Express Rate Limiting**:
  - `/api/v1/auth/*`: 100 requests / 15 minutes per IP (Brute-force protection).
  - `/api/v1/*`: 600 requests / minute per IP (DDoS and abuse protection).
- **React Error Boundary**: Top-level `<ErrorBoundary>` component catching uncaught exceptions gracefully without white screens, providing recovery actions ("Try Again" and "Return to Dashboard").
- **Graceful Network Handling**: Frontend API client handles network offline states (`NETWORK_ERROR`), token expiration auto-redirection (`401 Unauthorized`), and double-submission protection across all modals.
- **NotFound & Fallback Routing**: Robust 404 page for unmatched routes and 403 unauthorized redirection.
- **Zero JS Files**: Strict TypeScript compilation (`.ts`, `.tsx`) across entire frontend and backend with `verbatimModuleSyntax` and strict types.

### Running Automated Test Suite
To execute the comprehensive automated integration suite covering RBAC, 92 seats capacity invariant, admission billing edge cases, transaction locking, overpayment rejection, and diagnostics:
```bash
cd backend
npm test
```

### Production Build & Deployment
```bash
# Build backend
cd backend
npm run build

# Build frontend
cd ../frontend
npm run build
```


#   M Y _ L I B R A R Y  
 