# MY LIBRARY — Comprehensive API Documentation

## 1. Overview & Architecture

- **Base URL**: `/api/v1`
- **Default Port**: `5000` (Backend), `5173` (Frontend)
- **Timezone**: All business calculations and dates are anchored to Indian Standard Time (`Asia/Kolkata`, UTC+05:30).
- **Format**: All JSON endpoints follow the standardized response contract:
  - **Success**: `{ "success": true, "data": { ... } }`
  - **Error**: `{ "success": false, "error": { "code": string, "message": string, "details"?: any } }`
- **Security & Headers**:
  - `helmet` applied across all routes (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, etc.)
  - `express-rate-limit`:
    - `/api/v1/auth/*`: 100 requests per 15 minutes per IP (Brute-force protection)
    - `/api/v1/*`: 600 requests per minute per IP

---

## 2. Authentication & Authorization Matrix

JWT Bearer tokens are required for all protected endpoints via the HTTP header:
```http
Authorization: Bearer <jwt-token>
```

### Roles & Access Boundaries
| Role | Permitted Areas | Forbidden Areas |
| :--- | :--- | :--- |
| **OWNER** | Owner Dashboard, 92-Seat Management, Student Management, Billing Cycles, Payments, WhatsApp Reminders, Owner Profile | All Developer APIs (`/api/v1/developer/*`) returns **403 Forbidden** |
| **DEVELOPER** | Developer Dashboard, Income Analytics, Reports & Exports (CSV, XLSX, PDF), Activity Logs, System Health, Data Integrity Diagnostics, Developer Profile | Operational Owner endpoints (Strict separation of duties) |

---

## 3. Endpoints Directory

### 3.1 Authentication (`/api/v1/auth`)

#### `POST /api/v1/auth/login`
Authenticates a user (`OWNER` or `DEVELOPER`) and issues a JWT token.
- **Access**: Public (Subject to rate limiting)
- **Body**:
  ```json
  {
    "username": "owner",
    "password": "OwnerPassword123!"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "id": "uuid",
        "username": "owner",
        "role": "OWNER",
        "name": "Library Owner",
        "email": "owner@mylibrary.in"
      }
    }
  }
  ```

#### `GET /api/v1/auth/me`
Retrieves current authenticated user's profile and active role.
- **Access**: Authenticated (`OWNER` or `DEVELOPER`)
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid",
        "username": "developer",
        "role": "DEVELOPER"
      }
    }
  }
  ```

---

### 3.2 Owner Dashboard & Seats (`/api/v1/dashboard`, `/api/v1/seats`)

#### `GET /api/v1/dashboard/owner`
Real-time high-level operational statistics.
- **Access**: `OWNER`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "stats": {
        "totalSeats": 92,
        "occupiedSeats": 42,
        "availableSeats": 50,
        "activeStudents": 42,
        "archivedStudents": 8,
        "feesDueSoon": 5,
        "feesDue": 2,
        "feesOverdue": 1,
        "collectedThisPeriod": 62500
      }
    }
  }
  ```

#### `GET /api/v1/seats`
Retrieves the complete status of all 92 seats (Seat 1 to Seat 92).
- **Access**: `OWNER`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "seats": [
        {
          "id": "uuid",
          "seatNumber": 1,
          "status": "OCCUPIED",
          "currentStudent": {
            "id": "uuid",
            "name": "Aarav Sharma",
            "mobile": "9876543210",
            "shift": "FULL_DAY"
          }
        }
      ]
    }
  }
  ```

#### `POST /api/v1/seats/:seatNumber/assign`
Assigns an active student to an available seat.
- **Access**: `OWNER`
- **Body**: `{ "studentId": "uuid" }`

#### `POST /api/v1/seats/:seatNumber/vacate`
Vacates a seat, recording the transition in the audit trail.
- **Access**: `OWNER`

#### `POST /api/v1/seats/transfer/:studentId`
Atomically moves a student from their current seat to a new available seat.
- **Access**: `OWNER`
- **Body**: `{ "newSeatNumber": 45 }`

---

### 3.3 Student Management (`/api/v1/students`)

#### `GET /api/v1/students`
Search, filter, and paginate through students.
- **Access**: `OWNER`
- **Query Parameters**:
  - `search`: Name or mobile search string
  - `status`: `ACTIVE` | `ARCHIVED`
  - `shift`: `MORNING` | `EVENING` | `FULL_DAY`
  - `locker`: `WITH_LOCKER` | `WITHOUT_LOCKER`
  - `hasSeat`: `true` | `false`

#### `POST /api/v1/students`
Creates a student and automatically initializes their recurring admission-date billing period.
- **Access**: `OWNER`
- **Body**:
  ```json
  {
    "name": "Rohan Gupta",
    "mobile": "9811223344",
    "shift": "FULL_DAY",
    "locker": "WITH_LOCKER",
    "monthlyFee": 1500,
    "admissionDate": "2026-10-01",
    "seatNumber": 12
  }
  ```

#### `GET /api/v1/students/:id`
Retrieves comprehensive details of a student including current seat and active cycle.

#### `PATCH /api/v1/students/:id`
Updates student details (Shift, locker, monthly fee, etc.).

#### `POST /api/v1/students/:id/archive`
Archives student, vacates assigned seat, and freezes future billing cycle generation.

#### `POST /api/v1/students/:id/restore`
Restores student back to `ACTIVE` status.

---

### 3.4 Billing & Payments (`/api/v1/billing`)

#### `GET /api/v1/billing/periods`
Lists billing periods with calculated fee statuses (`PAID`, `PARTIALLY_PAID`, `DUE_SOON`, `DUE`, `OVERDUE`).
- **Access**: `OWNER`

#### `GET /api/v1/billing/students/:id/current`
Gets the active billing cycle for a student.

#### `GET /api/v1/billing/students/:id/history`
Gets chronological billing cycle history with payments for a student.

#### `POST /api/v1/billing/payments`
Records an atomic payment against a billing cycle.
- **Access**: `OWNER`
- **Double Submission / Overpayment Guard**: Automatically verifies that amount does not exceed remaining balance.
- **Body**:
  ```json
  {
    "studentId": "uuid",
    "billingPeriodId": "uuid",
    "amount": 1000,
    "paymentMethod": "UPI",
    "reference": "UPI-REF-9921",
    "note": "October fees partial payment"
  }
  ```

#### `PATCH /api/v1/billing/payments/:id`
Updates a payment record and atomically recalculates billing period status.

#### `GET /api/v1/billing/reminders`
Lists students with fees due or overdue for WhatsApp reminders.

#### `GET /api/v1/billing/whatsapp/prepare`
Generates pre-filled `https://wa.me/<mobile>?text=<encodedMessage>` link with customizable template.

---

### 3.5 Developer Analytics, Reports & Diagnostics (`/api/v1/developer`)

> **IMPORTANT**: ALL endpoints under `/api/v1/developer/*` strictly require `Role.DEVELOPER`. Any requests from `Role.OWNER` or unauthenticated sessions are rejected with **403 Forbidden** or **401 Unauthorized**.

#### `GET /api/v1/developer/dashboard`
Comprehensive 8-metric financial and operational overview:
- `totalGrossRevenue`: Total collected across all time
- `monthToDateRevenue`: Revenue collected in current calendar month
- `yearToDateRevenue`: Revenue collected in current calendar year
- `totalPendingFees`: Outstanding unpaid fees across active cycles
- `occupancyRate`: Exact percentage of 92 seats currently occupied
- `activeStudentCount`: Active student count
- `archivedStudentCount`: Archived student count
- `systemHealth`: Quick diagnostic health summary

#### `GET /api/v1/developer/income`
Detailed revenue breakdown with date filtering:
- Query: `preset` (`today`, `yesterday`, `this_week`, `this_month`, `prev_month`, `this_year`, `custom`), `startDate`, `endDate`.
- Returns breakdowns by:
  - Payment Method (`CASH`, `UPI`, `OTHER`)
  - Shift (`MORNING`, `EVENING`, `FULL_DAY`)
  - Locker Option (`WITH_LOCKER`, `WITHOUT_LOCKER`)

#### `GET /api/v1/developer/reports/income`
Aggregated income reports (Monthly/Yearly) with collection trends.

#### `GET /api/v1/developer/reports/income/export`
Exports revenue and payment reports into downloadable file formats:
- Query: `format=csv` (MIME: `text/csv`)
- Query: `format=xlsx` (MIME: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
- Query: `format=pdf` (MIME: `application/pdf`)

#### `GET /api/v1/developer/activity`
Audited activity feed with filtering:
- Query: `action` (`STUDENT_CREATED`, `SEAT_ASSIGNED`, `PAYMENT_CREATED`, `STUDENT_ARCHIVED`, etc.), `limit`, `offset`.

#### `GET /api/v1/developer/system`
System telemetry:
- Database connection status & latency (ms)
- Node.js runtime version & process uptime
- Entity record counts
- **Zero Secrets Guarantee**: Database credentials and JWT secrets are redacted.

#### `GET /api/v1/developer/system/integrity`
Executes the automated 9-point data integrity diagnostic engine:
1. Exact 92 seats count invariant (Seats 1 to 92)
2. Zero duplicate seat numbers
3. Invariant seat status synchronization
4. Zero orphan seat assignments
5. No active student holding multiple concurrent seats
6. Zero overlapping active assignments per seat
7. Active students have billing periods up to current cycle
8. Invariant payment status matches computed payment sum
9. Zero orphan payment records
- Returns: `{ "overallStatus": "PASS" | "WARNING" | "ERROR", "totalChecks": 9, "checks": [...] }`

#### `GET /api/v1/developer/profile`
Developer profile details and security management.
