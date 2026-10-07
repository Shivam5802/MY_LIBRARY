# MY LIBRARY

MY LIBRARY is a responsive library and study-center management system engineered for physical study halls with an exact capacity of 92 seats. It manages desk assignments, student records, admission-date-based recurring billing cycles, payment tracking, WhatsApp fee reminders, administrative reporting, and developer diagnostics across desktop and mobile devices.

---

# Features

### Implemented Features
- **92-Seat Management**: Interactive desk map strictly enforcing seats 1 through 92, real-time `AVAILABLE` and `OCCUPIED` status tracking, and seat detail drawers.
- **Student Management**: Student directory with search, filtering by shift, locker, and assignment status, student profile viewing, and editing.
- **Profile Photo Crop & Adjust**: Built-in canvas-based circular avatar cropping modal with zoom (50%–300%), 90-degree rotation, and pan adjustments.
- **Seat Assignment & Transfer**: Direct seat allocation, one-click seat vacation, and atomic seat transfer with history tracking.
- **Student Archive, Restore & Permanent Removal**: Safe student archiving that automatically vacates seats while preserving financial history, student restoration, and permanent removal option.
- **Fee Cycle Start Date & Due Date Architecture**: Strict architectural separation between `Admission Date` (when the student was admitted) and `Fee Cycle Start Date` (when recurring monthly fee counting begins). Due Date is the next monthly anniversary (1 month after cycle start). Billing periods run from the cycle start date through 1 day before the next monthly anniversary (inclusive), with deterministic month-end clipping (28th–31st, leap-year aware).
- **Payment Tracking & Audit Receipts**: Transactional payment recording supporting `CASH`, `UPI`, and `OTHER`, sequential receipt numbers (`RCP-YYYYMMDD-XXXX`), and zero overpayment enforcement.
- **Partial Payments**: Comprehensive split and partial payment support with live balance recalculation and status transition (`PARTIALLY_PAID`).
- **5-Day Dashboard Alert & Real-Time Status**: Dynamic calculation of user-facing fee statuses: `PAID`, `DUE_SOON` (within 5 days before Due Date), `DUE` (on Due Date), and `OVERDUE` (past Due Date). High-visibility alert cards and clickable metric on Owner Dashboard (`/owner/payments?status=DUE_SOON`).
- **Strict DD-MM-YYYY Date Standardization**: Every single date displayed across the application and generated in WhatsApp reminders is strictly formatted as `DD-MM-YYYY` (e.g., `10-09-2026`).
- **5-Day Fee Reminders**: Proactive reminder queue filtering students whose fee due date is within 5 days or past due.
- **WhatsApp Click-to-Chat Reminders**: Direct WhatsApp link generation with Indian number normalization (`+91`) and customizable message templates with tokens (`{name}`, `{amount}`, `{dueDate}`).
- **Owner Dashboard**: High-level operational stats (total, occupied, and available seats, active and archived students, 5-day fee due soon alert card, recent activity).
- **Developer Dashboard & Analytics**: Lifetime, today's, current month, previous month, and current year income metrics, 12-month income trends, and payment method breakdowns.
- **Centralized Reports**: 8 comprehensive operational and financial report categories (Income, Pending Fees, Student Directory, Seat Occupancy, Admissions, Shift Breakdown, Locker Usage, and Monthly Summary).
- **Multi-Format Exports**: Client-side and server-side export engine generating clean **CSV** (UTF-8 BOM), **Excel** (.xlsx multi-sheet workbooks), and printable **PDF** reports.
- **Activity & Audit Logging**: Chronological administrative audit logs with search, action filtering, role filtering, and sanitized metadata inspection.
- **Developer Diagnostics & Health Telemetry**: Live system health endpoint and a 9-point non-destructive data integrity invariant verification suite.
- **Profile Management**: Profile detail and password update interfaces for both Owner and Developer accounts.
- **Dark, Light & System Theme**: Theme toggle supporting Light, Dark, and System modes with theme persistence in local storage and tailored Recharts palette integration.
- **Responsive UI & Mobile Navigation**: Desktop layout with responsive sidebar and data tables, paired with a mobile bottom navigation bar, touch-friendly drawers, and card layouts.
- **Autonomous Static Mode Option**: Client-side static database engine (`src/mock/staticData.ts`) providing full offline UI functionality without requiring a running PostgreSQL database.

### Incomplete / Planned Features (Not Implemented)
- **Automated WhatsApp Bot Delivery**: Direct programmatic message sending via the official WhatsApp Cloud/Business API is *Not implemented* (currently uses client-side `wa.me` click-to-chat).
- **Automated WhatsApp Delivery Confirmation / Webhooks**: *Not implemented*.
- **Online Payment Gateway Integration**: Razorpay/Stripe checkout is *Not implemented* (payments are recorded manually for counter/UPI receipts).
- **Automated Scheduled Cron Reminders**: Background cron sending unattended WhatsApp messages is *Not implemented*.
- **Automated Cloud Database Backups**: *Not implemented*.
- **Multi-Branch / Multi-Location Support**: *Not implemented* (system is single-branch with exactly 92 seats).
- **Biometric / QR Code Student Attendance**: *Not implemented*.

---

# Roles & Permissions

MY LIBRARY enforces a strict separation of duties between two distinct administrative roles:

## OWNER
The **OWNER** manages daily front-desk operations:
- Managing 92 seats (assigning, transferring, vacating).
- Admitting, editing, archiving, restoring, and deleting students.
- Generating and monitoring recurring admission-date billing cycles.
- Recording, editing, and viewing payment receipts.
- Sending WhatsApp fee reminders using customizable templates.
- Updating Owner contact information, avatar, and password.
- **Restricted**: Access to developer-only financial analytics, activity logs, system health, and diagnostic tools is blocked with HTTP `403 Forbidden`.

## DEVELOPER
The **DEVELOPER** manages system telemetry, high-level financial reporting, and data integrity:
- Inspecting high-level financial metrics (Lifetime, Today, Current Month, Previous Month, Year).
- Accessing advanced report categories and generating CSV, Excel (.xlsx), and PDF exports.
- Viewing system activity logs and audit trails.
- Monitoring system runtime diagnostics and executing the 9-point data integrity suite.
- Updating Developer account details and credentials.
- **Restricted**: Front-desk operations (assigning seats, admitting students, recording individual payments) are reserved for the OWNER role.

### Permission Matrix

| Feature | OWNER | DEVELOPER | Backend Route Guard |
|---|:---:|:---:|---|
| Owner Dashboard (`/api/v1/dashboard/owner`) | **Yes** | No | `requireRole(Role.OWNER)` |
| Student Management (`/api/v1/students/*`) | **Yes** | No | `requireRole(Role.OWNER)` |
| Seat Management (`/api/v1/seats/*`) | **Yes** | No | `requireRole(Role.OWNER)` |
| Billing Cycles (`/api/v1/billing/periods*`) | **Yes** | No | `requireRole(Role.OWNER)` |
| Payment Recording (`/api/v1/billing/payments*`) | **Yes** | No | `requireRole(Role.OWNER)` |
| Fee Reminders & Templates (`/api/v1/billing/reminders*`) | **Yes** | No | `requireRole(Role.OWNER)` |
| Developer Dashboard (`/api/v1/developer/dashboard`) | No | **Yes** | `requireRole(Role.DEVELOPER)` |
| Income Analytics (`/api/v1/developer/income`) | No | **Yes** | `requireRole(Role.DEVELOPER)` |
| Advanced Reports (`/api/v1/developer/reports/*`) | No | **Yes** | `requireRole(Role.DEVELOPER)` |
| File Exports (CSV, XLSX, PDF) | No | **Yes** | `requireRole(Role.DEVELOPER)` |
| Activity Logs (`/api/v1/developer/activity`) | No | **Yes** | `requireRole(Role.DEVELOPER)` |
| System Health (`/api/v1/developer/system`) | No | **Yes** | `requireRole(Role.DEVELOPER)` |
| 9-Point Data Integrity Suite (`/api/v1/developer/system/integrity`) | No | **Yes** | `requireRole(Role.DEVELOPER)` |
| Profile & Password Settings | **Yes** (Owner profile) | **Yes** (Developer profile) | Separate endpoints per role |

---

# Technology Stack

## Frontend
- **Framework**: React 19 (`react` 19.2.8, `react-dom` 19.2.8)
- **Language**: TypeScript (`typescript` ~6.0.2)
- **Build Tool**: Vite (`vite` 8.3.3) with `@vitejs/plugin-react`
- **Styling**: Tailwind CSS v4 (`tailwindcss` 4.3.3, `@tailwindcss/vite` 4.3.3)
- **Routing**: React Router v7 (`react-router-dom` 7.18.4)
- **Icons**: Lucide React (`lucide-react` 1.52.0)
- **Charts & Visualizations**: Recharts (`recharts` 3.10.1)
- **Image Processing**: HTML5 Canvas API (custom square/circular avatar crop and rotation engine)
- **Linter**: Oxlint (`oxlint` 1.81.0)

## Backend
- **Runtime**: Node.js (v20+ recommended)
- **Framework**: Express (`express` 4.21.2)
- **Language**: TypeScript (`typescript` 5.6.3, executed via `tsx` 4.19.2)
- **Database & ORM**: PostgreSQL with Prisma ORM (`@prisma/client` 5.22.0, `prisma` 5.22.0)
- **Authentication**: JSON Web Tokens (`jsonwebtoken` 9.0.2) with Bearer token authorization
- **Password Hashing**: Bcrypt (`bcryptjs` 2.4.3)
- **Validation**: Zod schema validation (`zod` 3.23.8)
- **Security & Rate Limiting**: Helmet (`helmet` 8.3.0), Express Rate Limit (`express-rate-limit` 8.7.1), CORS (`cors` 2.8.5)
- **Export Engines**: ExcelJS (`exceljs` 4.4.0), PDFKit (`pdfkit` 0.20.2), PDFMake (`pdfmake` 0.3.11)
- **Environment Management**: Dotenv (`dotenv` 16.4.7)

## Testing
- **Integration & Invariant Suite**: Custom TypeScript verification runner executed via `tsx` (`src/verify-prompt5.ts`) configured under `npm test` in `backend/package.json`.
- **Linter**: Oxlint (`npm run lint` in `frontend/package.json`).
- **Static Type Checking**: `tsc -b` (frontend), `tsc` (backend).

---

# Architecture

```text
Browser Client
     ↓
React 19 + TypeScript (Vite + Tailwind CSS v4)
     ↓
REST API (HTTP / JSON via fetch)
     ↓
Express 4 + TypeScript Application
     ├── Helmet Security Headers & Rate Limiting
     ├── JWT Authentication Middleware
     ├── Role-Based Access Control (requireRole: OWNER / DEVELOPER)
     └── Zod Input Validation Middleware
     ↓
Controllers
     ↓
Service Layer (Business Logic & Audit Logging)
     ↓
Prisma ORM (Schema & Transactions)
     ↓
PostgreSQL Database
```

Detailed architectural specifications, data flow, and endpoint designs are maintained in [API Documentation](docs/API.md).

---

# Project Structure

```text
MY-LIBRARY/
├── backend/
│   ├── prisma/
│   │   ├── migrations/            # PostgreSQL migrations
│   │   ├── schema.prisma          # Database schema (8 models, 6 enums)
│   │   └── seed.ts                # Idempotent seeder: roles, users, and seats 1–92
│   ├── src/
│   │   ├── config/                # Environment variables and Prisma client singleton
│   │   ├── controllers/           # HTTP controllers for all domain entities
│   │   ├── middleware/            # Auth, RBAC guards, validation, and error handlers
│   │   ├── routes/                # Versioned Express routes mounted on /api/v1
│   │   ├── services/              # Domain services (billing, seat, export, etc.)
│   │   ├── types/                 # Backend TypeScript interfaces and enums
│   │   ├── utils/                 # Billing date math, JWT, password, timezone utils
│   │   ├── app.ts                 # Express application configuration and CORS
│   │   ├── server.ts              # HTTP server entry point
│   │   ├── verify-prompt4.ts      # Developer functionality verification script
│   │   └── verify-prompt5.ts      # Comprehensive test and security verification suite
│   ├── .env.example               # Backend environment variable template
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── assets/                # Logos and icons
│   │   ├── components/            # Reusable UI components (SeatGrid, ImageCropModal, etc.)
│   │   ├── context/               # AuthContext (JWT session) and ThemeContext (Dark/Light)
│   │   ├── layouts/               # OwnerLayout and DeveloperLayout (Desktop & Mobile)
│   │   ├── mock/                  # Autonomous static database engine (staticData.ts)
│   │   ├── pages/                 # Route page components for Owner and Developer
│   │   ├── routes/                # ProtectedRoute role guard wrapper
│   │   ├── services/              # Client-side API and static services
│   │   ├── types/                 # Frontend TypeScript interfaces
│   │   ├── App.tsx                # Client-side routing configuration
│   │   ├── index.css              # Global styles and Tailwind v4 setup
│   │   └── main.tsx               # Frontend bootstrap entry point
│   ├── .env.example               # Frontend environment variable template
│   ├── index.html                 # HTML entry template
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── docs/
│   └── API.md                     # Comprehensive REST API reference
│
├── .gitignore
└── README.md
```

---

# Core Business Rules

1. **Exact 92-Seat Capacity**: The system supports exactly 92 physical seats. Seat numbers range strictly from 1 to 92 without gaps or extra numbers.
2. **Permanent Student Identity**: Each student is assigned a permanent identifier independent of any seat. Seat reassignments or vacations do not alter the student's ID or payment history.
3. **One-to-One Seat Occupancy**: A student may occupy at most one active seat at any given time. A seat may have at most one active student assigned to it.
4. **Archived Student Isolation**: When a student is archived, any currently occupied seat is automatically vacated and released immediately. Archived students cannot be assigned seats.
5. **Admission-Date Recurring Billing**: Billing is anchored to the student's **admission date**, not the calendar month. A student admitted on the 12th of September is billed for cycles running 12 Sep → 11 Oct, 12 Oct → 11 Nov, etc.
6. **Month-End Date Clipping**: For admission dates on the 28th, 29th, 30th, or 31st, billing cycles automatically clip to the last valid day of shorter months (e.g., 31 Jan admission in a non-leap year yields 31 Jan → 27 Feb, followed by 28 Feb → 30 Mar).
7. **Historical Billing Immutability**: Historical billing periods preserve snapshot fees (`shiftSnapshot`, `lockerSnapshot`, `amount`). Future fee changes never alter previously generated billing records.
8. **No Overpayments**: Payment amounts must be greater than zero and must not exceed the outstanding balance of the associated billing period. Overpayments are rejected inside transactional database locks.
9. **Dynamic Fee Statuses**: Fee status is calculated on demand:
   - `PAID`: Outstanding balance is 0.
   - `PARTIALLY_PAID`: Outstanding balance is greater than 0, but payments have been recorded.
   - `DUE_SOON`: Outstanding balance remains and 1 to 5 days remain until the cycle due date.
   - `DUE`: Outstanding balance remains and 0 days remain (due date is today).
   - `OVERDUE`: Outstanding balance remains and the due date has passed (< 0 days remaining).
10. **5-Day Reminder Threshold**: Active students qualify for fee reminder queues when their current cycle is within 5 days of expiration or is overdue.
11. **Developer-Only Financial Reporting**: Full financial income statements, trend analysis, audit logs, and export downloads are accessible exclusively to users with the `DEVELOPER` role.

---

# Billing

### Admission-Date Billing Logic
Traditional library systems incorrectly bill on the 1st of every calendar month. MY LIBRARY uses an admission-date engine implemented in `BillingDateUtils` (`backend/src/utils/billing-date.ts`).

#### Cycle Example
If student *Rahul Kumar* is admitted on **12 September**:
- **Cycle 1**: 12 Sep → 11 Oct (Due date: 11 Oct)
- **Cycle 2**: 12 Oct → 11 Nov (Due date: 11 Nov)
- **Cycle 3**: 12 Nov → 11 Dec (Due date: 11 Dec)

#### Month-End Edge Cases
If student *Priya Sharma* is admitted on **31 January**:
- In a non-leap year (February has 28 days), the next anchor date clips to 28 Feb. Cycle 1 runs: **31 Jan → 27 Feb**.
- The following cycle begins 28 Feb and runs until the day prior to 31 March: **28 Feb → 30 Mar**.
- All calculations are pinned to `Asia/Kolkata` calendar dates to prevent timezone drift.

---

# Payments

- **Supported Payment Methods**: `CASH`, `UPI`, `OTHER`.
- **Transactional Integrity**: All payments are executed within Prisma database transactions (`prisma.$transaction`) with balance recalculation.
- **Overpayment Prevention**: The engine rejects payment amounts exceeding the cycle's outstanding balance with an HTTP 400 error.
- **Partial Payments**: Payments less than the full amount are recorded, and the cycle status is updated to `PARTIALLY_PAID`.
- **Sequential Receipt Numbers**: Each transaction generates an audit receipt formatted as `RCP-YYYYMMDD-XXXX`.
- **Payment Modifications**: Authorized owners can adjust payment amounts, dates, methods, notes, or references. The system recalculates balances and cycle statuses accordingly.
- **Monetary Precision**: Stored as `Decimal(10, 2)` in PostgreSQL to eliminate floating-point rounding errors.

---

# Seat Management

- **Capacity**: Exactly 92 desks (numbered 1 through 92).
- **Seat States**:
  - `AVAILABLE`: Desk is open for assignment.
  - `OCCUPIED`: Desk has an active student assignment.
- **Assignment**: Linking an active unassigned student to an available seat.
- **Transfer**: Atomically vacating the student's existing seat and assigning them to a new available seat in a single transaction.
- **Vacation**: Releasing a seat back to `AVAILABLE` while keeping the student `ACTIVE`.
- **Audit History**: All seat assignments and vacations are tracked in `student_seat_assignments` with `assignedAt`, `vacatedAt`, and `isCurrent` flags.

---

# Student Management

### Student Attributes
- **id**: Unique identifier (UUID).
- **name**: Full student name.
- **mobile**: Contact number.
- **photoUrl**: Profile photo (base64 or URL) with built-in crop and adjust support.
- **shift**: `MORNING`, `EVENING`, or `FULL_DAY`.
- **locker**: `WITH_LOCKER` or `WITHOUT_LOCKER`.
- **admissionDate**: ISO Date determining recurring billing cycles.
- **monthlyFee**: Monthly fee amount in Indian Rupees (`Decimal(10, 2)`).
- **status**: `ACTIVE` or `ARCHIVED`.
- **createdAt / updatedAt**: Audit timestamps.
- **archivedAt**: Timestamp recorded upon archiving.

### Student Lifecycle
- **Active Students**: Can hold active seats, appear in operational reminder queues, and generate active billing cycles.
- **Archived Students**: Cannot hold seats (any occupied seat is immediately released upon archiving) and do not generate future billing cycles.
- **Permanent Removal**: Complete deletion removes the student record, releases their seat, clears billing associations, and logs the deletion to the audit trail.

---

# Fee Reminders & WhatsApp

- **Queue Filtering**: The fee reminder queue identifies students whose billing cycle has 5 days or fewer remaining or is overdue.
- **Click-to-Chat Integration**: Clicking WhatsApp opens `https://wa.me/<normalized_mobile>?text=<encoded_message>` on WhatsApp Web or mobile.
- **Phone Number Normalization**: Automatically strips punctuation and prepends India's country code (`+91`) for 10-digit mobile numbers.
- **Customizable Message Templates**: Managed via Owner settings and stored in `system_settings`:
  ```text
  Hello {name}, your MY LIBRARY fee of ₹{amount} is due on {dueDate}. Please complete your payment on time. Thank you.
  ```
- **Important Limitation**: Click-to-chat opens WhatsApp with a pre-filled message; it cannot confirm whether the user actually clicked "Send" in the WhatsApp interface.

---

# Dashboard

## Owner Dashboard
- **Key Performance Indicators**: Total Seats (92), Occupied Seats, Available Seats, Active Students, Archived Students.
- **Fee Overview**: Counts for Fees Due Soon, Fees Due, and Fees Overdue, plus total collections for the current period.
- **Seat Grid Overview**: Visual snapshot of desk allocations.
- **Fee Reminders Quick Actions**: Actionable list of students with upcoming or overdue fees and one-click WhatsApp reminder triggers.

## Developer Dashboard
- **Income Telemetry**:
  - **Lifetime Income**: Cumulative total of all recorded payments.
  - **Today's Income**: Collections during the current business day in IST.
  - **Current Month Income**: Collections from day 1 of the current month to date.
  - **Previous Month Income**: Collections during the preceding calendar month.
  - **Current Year Income**: Collections since January 1 of the current year.
  - **Pending Fees**: Sum of outstanding balances across all active billing periods.
  - **Expected Income**: Total scheduled revenue for the current active periods.
- **12-Month Trend Visualizations**: Responsive area charts plotting historical monthly revenues.
- **Payment Method Breakdown**: Pie chart and percentage breakdowns for `UPI`, `CASH`, and `OTHER`.
- **Shift & Locker Utilization**: Income distributions by shift (`MORNING`, `EVENING`, `FULL_DAY`) and locker preference (`WITH_LOCKER`, `WITHOUT_LOCKER`).

---

# Reports & Exports

### Supported Report Categories
1. **Income & Payments**: Chronological ledger of all recorded payments, receipt numbers, payment methods, and student details.
2. **Pending Fees**: Complete register of unpaid and partially paid billing cycles with overdue day counts.
3. **Student Directory**: Roster of admitted students with shifts, lockers, contact info, and current statuses.
4. **Seat Occupancy (92)**: Full status report for every desk from seat 1 to seat 92.
5. **Student Admissions**: Chronological log of student enrollments.
6. **Shift Breakdown**: Student distributions and revenues across Morning, Evening, and Full Day shifts.
7. **Locker Usage**: Counts, percentages, and fees for locker utilization.
8. **Monthly Summary**: High-level financial summaries aggregated by month.

### Supported Export Formats
- **CSV**: UTF-8 encoded with Byte Order Mark (BOM) for compatibility with Excel and third-party tools.
- **Excel (.xlsx)**: Formatted workbooks generated using `exceljs` featuring styled header bars, borders, and summary totals.
- **Printable PDF**: Formatted landscape reports generated via `pdfkit` (backend) or styled print documents (frontend static engine).

---

# Activity Logs

Every administrative operation records an audit entry in the `activity_logs` table:
- **Recorded Actions**: `LOGIN`, `LOGIN_FAILED`, `STUDENT_CREATED`, `STUDENT_UPDATED`, `STUDENT_ARCHIVED`, `STUDENT_RESTORED`, `STUDENT_DELETED`, `SEAT_ASSIGNED`, `SEAT_VACATED`, `SEAT_TRANSFERRED`, `PAYMENT_CREATED`, `PAYMENT_UPDATED`, `REMINDER_SENT`, `SYSTEM_SETTING_UPDATED`.
- **Captured Metadata**: Timestamp, user ID, username, user role, action, affected entity, IP address, user-agent, and sanitized JSON payload.
- **Sanitization Guard**: `ActivityLogService` automatically strips passwords, tokens, hashes, and secrets before persisting to the database.

---

# Authentication & Security

- **JSON Web Tokens (JWT)**: Stateless authentication via `Authorization: Bearer <token>` headers with configurable expiration (`JWT_EXPIRES_IN`).
- **Password Hashing**: Secure salted password hashing using Bcrypt (`bcryptjs`, 12 salt rounds during seed).
- **HTTP Security Headers**: Express middleware configured with `helmet` (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, HSTS).
- **Rate Limiting**:
  - Authentication endpoints: 100 requests per 15 minutes per IP.
  - General API endpoints: 600 requests per minute per IP.
- **Role-Based Authorization**: Route-level guards enforcing role boundaries (`requireRole(Role.OWNER)` vs `requireRole(Role.DEVELOPER)`).
- **Cross-Origin Resource Sharing (CORS)**: Configured to accept requests from allowed frontend origins.
- **Error Shielding**: Database connection strings, stack traces, and internal errors are suppressed in API responses.

---

# Theme

- **Modes**:
  1. **Light Mode**: High-contrast white and slate surfaces with dark typography.
  2. **Dark Mode**: Slate-900 and slate-950 backgrounds with muted borders.
  3. **System Mode**: Automatically syncs with the operating system or browser preference via `window.matchMedia('(prefers-color-scheme: dark)')`.
- **Persistence**: Saved in browser local storage (`my_library_theme`) to prevent theme flashing on reload.
- **Theme-Aware Charts**: Recharts grids, tooltips, and axes automatically adapt colors to the active theme.

---

# Responsive Design

- **Desktop (>= 1024px)**:
  - Fixed administrative navigation sidebar.
  - Multi-column dashboard layouts.
  - Data tables with sorting, filtering, and row actions.
  - Sticky header with quick profile access and theme toggle.
- **Mobile (< 1024px)**:
  - Fixed bottom navigation bar for primary navigation.
  - Responsive card lists replacing wide data tables.
  - Mobile slide-over drawers for seat assignments and payment forms.
  - Touch-friendly 44px tap targets.

---

# Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `PORT` | No | `5000` | Port for the Express API server |
| `NODE_ENV` | No | `development` | Runtime environment (`development`, `production`, `test`) |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | Allowed frontend origin for CORS configuration |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Cryptographic secret for signing JWT tokens |
| `JWT_EXPIRES_IN` | No | `24h` | Token validity duration |
| `SEED_OWNER_USERNAME` | Yes* | `owner` | Initial Owner account username (used by `prisma/seed.ts`) |
| `SEED_OWNER_PASSWORD` | Yes* | `OwnerPassword123!` | Initial Owner account password (used by `prisma/seed.ts`) |
| `SEED_DEVELOPER_USERNAME` | Yes* | `developer` | Initial Developer account username (used by `prisma/seed.ts`) |
| `SEED_DEVELOPER_PASSWORD` | Yes* | `DeveloperPassword123!` | Initial Developer account password (used by `prisma/seed.ts`) |

*\* Required only when running the database seed script.*

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `VITE_API_URL` | No | `/api/v1` | Base URL for backend API requests |

---

# Installation

## Prerequisites
- **Node.js**: Version 20.x or higher
- **npm**: Version 10.x or higher
- **PostgreSQL**: Version 14.x or higher (optional if running in frontend static mode)
- **Git**: Installed and configured

## Clone
```bash
git clone <YOUR_REPOSITORY_URL>
cd MY-LIBRARY
```

---

# Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials and JWT secret
   ```
4. Generate the Prisma client:
   ```bash
   npm run prisma:generate
   ```
5. Apply database migrations:
   ```bash
   npm run prisma:migrate
   ```
6. Seed the database with users and seats 1–92:
   ```bash
   npm run prisma:seed
   ```
7. Start the development server:
   ```bash
   npm run dev
   ```

---

# Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (optional):
   ```bash
   cp .env.example .env
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

---

# Database Setup

- PostgreSQL connection is configured via `DATABASE_URL`:
  ```text
  postgresql://postgres:password@localhost:5432/my_library?schema=public
  ```
- **Seeding Behavior**: Running `npm run prisma:seed` executes `prisma/seed.ts`, which:
  - Creates the default `OWNER` user.
  - Creates the default `DEVELOPER` user.
  - Verifies and inserts exactly **92 seats** (`SeatStatus.AVAILABLE`), numbered 1 through 92.
  - Is idempotent and safe to run multiple times.

---

# Development

To run the complete system locally:
1. Ensure PostgreSQL is running on `localhost:5432`.
2. Start the backend on port `5000`:
   ```bash
   cd backend && npm run dev
   ```
3. Start the frontend on port `5173`:
   ```bash
   cd frontend && npm run dev
   ```
4. Open your browser at `http://localhost:5173`.

> **Note**: The frontend also includes an autonomous static data engine (`src/mock/staticData.ts`). If the backend server is not running, the application can operate entirely client-side with full seat, student, and payment workflows.

---

# Testing

### Backend Integration & Invariant Tests
```bash
cd backend
npm test
```
*Executes `src/verify-prompt5.ts` using `tsx`, validating HTTP security headers, rate limiting, RBAC matrices, 92-seat capacity invariants, admission-date billing edge cases, and transactional locking.*

### Frontend Linting
```bash
cd frontend
npm run lint
```
*Executes `oxlint` across all TypeScript and TSX files.*

### Static Type Checking
```bash
# Frontend
cd frontend
npx tsc -b

# Backend
cd backend
npx tsc --noEmit
```

---

# Production Build

### Backend Build
```bash
cd backend
npm run build
```
*Compiles TypeScript from `src/` to JavaScript in `dist/`.*

### Frontend Build
```bash
cd frontend
npm run build
```
*Runs `tsc -b && vite build` to generate production assets in `frontend/dist/`.*

### Production Database Migration
```bash
cd backend
npx prisma migrate deploy
```

### Production Startup
```bash
cd backend
npm start
```
*Starts the compiled server via `node dist/server.js`.*

---

# API Overview

The backend mounts all versioned endpoints under `/api/v1`:

| Route Prefix | Access Level | Description |
|---|---|---|
| `/api/v1/health` | Public | Service health and liveness check |
| `/api/v1/auth` | Public / Authenticated | Authentication, JWT issuance, profile check |
| `/api/v1/seats` | `OWNER` | 92-seat grid, assignment, transfer, and vacation |
| `/api/v1/students` | `OWNER` | Student CRUD, archiving, and restoration |
| `/api/v1/dashboard` | `OWNER` | Owner operational metrics and stats |
| `/api/v1/owner` | `OWNER` | Owner profile and password management |
| `/api/v1/billing` | `OWNER` | Billing periods, payments, WhatsApp reminders |
| `/api/v1/developer` | `DEVELOPER` | Financial analytics, reports, exports, audit logs, and diagnostics |
| `/api/v1/test` | Role-protected | Role validation test routes |

For detailed request and response contracts, see [API Documentation](docs/API.md).

---

# Database Overview

The PostgreSQL database is defined in `backend/prisma/schema.prisma` with 8 models:

- **User**: System accounts (`OWNER`, `DEVELOPER`) with salted password hashes.
- **Seat**: Exactly 92 physical seats (`seat_number` 1–92, `status`).
- **Student**: Student records (`name`, `mobile`, `shift`, `locker`, `admission_date`, `monthly_fee`, `status`).
- **StudentSeatAssignment**: One-to-one seat allocations with historical audit flags (`is_current`, `assigned_at`, `vacated_at`).
- **BillingPeriod**: Admission-date fee cycles with snapshot attributes (`period_start`, `period_end`, `amount`, `status`).
- **Payment**: Financial transactions with unique receipt numbers (`amount`, `payment_method`, `receipt_number`).
- **SystemSetting**: Application configuration key-value store (e.g., WhatsApp reminder templates).
- **ActivityLog**: Administrative audit trail tracking actions, actors, IP addresses, and sanitized metadata.

---

# Documentation

- [API Reference](docs/API.md) — Comprehensive documentation of all REST endpoints, parameters, and error codes.

---

# Troubleshooting

### Database connection error (`P1001: Can't reach database server`)
- Verify PostgreSQL is running: `pg_isready -h localhost -p 5432`.
- Check that the credentials in `backend/.env` under `DATABASE_URL` match your PostgreSQL configuration.

### Prisma migration or client error
- Re-generate the Prisma client: `npm run prisma:generate` inside the `backend` directory.
- Re-apply migrations: `npm run prisma:migrate`.

### CORS error in browser
- Ensure `FRONTEND_URL` in `backend/.env` matches the port where your frontend is running (default: `http://localhost:5173`).

### 401 Unauthorized errors
- Ensure you have run the database seed (`npm run prisma:seed`) to create the initial `owner` and `developer` accounts.
- Verify that your token has not expired (`JWT_EXPIRES_IN=24h`).

### Port already in use
- Change the `PORT` variable in `backend/.env` to another available port (e.g., `PORT=5001`), and update `VITE_API_URL` in `frontend/.env` accordingly.

---

# Security Notes

- **Environment Secrets**: Never commit `.env` files containing real production database URLs, secrets, or passwords to source control.
- **Strong Production Secrets**: Always replace placeholder values for `JWT_SECRET` with strong, randomly generated strings in production.
- **HTTPS Enforcement**: Always deploy behind a reverse proxy (e.g., Nginx, Cloudflare) with TLS/HTTPS enabled in production.
- **Metadata Sanitization**: The activity logging service automatically strips sensitive fields (`password`, `token`, `jwt`) before persisting.
- **Bcrypt Salt Rounds**: Passwords must always be hashed with a minimum of 12 salt rounds.
- **Database Backups**: Schedule regular automated PostgreSQL pg_dump backups for production instances.

---

# Backup & Recovery

- Automated database backups are **not currently implemented** within the application codebase.
- **Recommended Production Practice**: Configure a daily cron job using PostgreSQL utilities:
  ```bash
  pg_dump -U postgres -d my_library -F c -b -v -f "/backups/my_library_$(date +%Y%m%d_%H%M%S).dump"
  ```

---

# Known Limitations

- **Local Storage for Avatars**: Profile photos are stored as base64 data URLs rather than on cloud object storage (e.g., S3).
- **WhatsApp Click-to-Chat**: The reminder system opens WhatsApp with pre-filled messages; delivery confirmation is not programmatically verifiable without the official WhatsApp Business API.
- **Single Branch Only**: The system is tailored for a single location with a strict 92-seat capacity. Multi-branch support is not available.
- **Manual Payment Entry**: No online payment gateway (UPI QR generation or Razorpay/Stripe checkout) is integrated; payments are recorded manually by the owner.

---

# Future Improvements

- Official WhatsApp Cloud/Business API integration for automated, confirmed message delivery.
- Online payment gateway integration (Razorpay, UPI QR) for automated fee reconciliation.
- Cloud object storage (AWS S3 / Cloudflare R2) for high-resolution image uploads.
- Student portal for self-service receipt downloads and seat renewal requests.
- Biometric or QR-code-based attendance tracking.
- Multi-branch architecture supporting multiple study centers.

---

# License

License: Not currently specified.