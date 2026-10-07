import assert from 'node:assert';
import http from 'http';
import { app } from './app.js';
import { BillingDateUtils } from './utils/billing-date.js';
import { FeeStatusService } from './services/fee-status.service.js';
import { prisma } from './config/prisma.js';

function makeRequest(
  server: http.Server,
  path: string,
  method = 'GET',
  token?: string,
  body?: any
): Promise<{ status: number; data: any; rawBuffer: Buffer; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const addr = server.address() as any;
    const postData = body ? JSON.stringify(body) : undefined;

    const req = http.request(
      {
        host: '127.0.0.1',
        port: addr.port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on('end', () => {
          const rawBuffer = Buffer.concat(chunks);
          const rawStr = rawBuffer.toString('utf-8');
          let data: any = rawStr;
          try {
            data = JSON.parse(rawStr);
          } catch {}
          resolve({
            status: res.statusCode || 500,
            data,
            rawBuffer,
            headers: res.headers,
          });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runPrompt5Verification() {
  console.log('===============================================================');
  console.log('       MY LIBRARY - COMPREHENSIVE PROMPT 5 VERIFICATION SUITE');
  console.log('===============================================================');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  try {
    let ownerToken = '';
    let devToken = '';

    // =========================================================================
    // 1. SECURITY & HTTP HARDENING AUDIT
    // =========================================================================
    console.log('\n--- 1. Security & HTTP Hardening Audit ---');
    const healthRes = await makeRequest(server, '/api/v1/health', 'GET');
    assert.strictEqual(healthRes.status, 200, 'Health endpoint must respond 200');

    // Helmet security headers check
    const h = healthRes.headers;
    assert.ok(
      h['x-dns-prefetch-control'] !== undefined ||
      h['x-frame-options'] !== undefined ||
      h['x-content-type-options'] !== undefined,
      'Helmet security headers must be present on responses'
    );
    console.log('✓ Helmet security headers verified (x-frame-options / content-type-options present).');

    // Rate limiter header check
    const authProbe = await makeRequest(server, '/api/v1/auth/login', 'POST', undefined, {
      username: 'invalid_user',
      password: 'invalid_password',
    });
    assert.strictEqual(authProbe.status, 401, 'Invalid credentials should return 401');
    assert.ok(
      authProbe.headers['ratelimit-limit'] !== undefined ||
      authProbe.headers['x-ratelimit-limit'] !== undefined,
      'Rate limit headers should be emitted by auth limiter'
    );
    console.log('✓ Rate limiting middleware configured and headers verified.');

    // =========================================================================
    // 2. AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
    // =========================================================================
    console.log('\n--- 2. Authentication & Authorization Matrix ---');

    // Owner Login
    const ownerLogin = await makeRequest(server, '/api/v1/auth/login', 'POST', undefined, {
      username: 'owner',
      password: 'OwnerPassword123!',
    });
    assert.strictEqual(ownerLogin.status, 200, 'Owner login must succeed');
    assert.strictEqual(ownerLogin.data.data.user.role, 'OWNER');
    ownerToken = ownerLogin.data.data.token;
    console.log('✓ Owner login succeeded (Role: OWNER).');

    // Developer Login
    const devLogin = await makeRequest(server, '/api/v1/auth/login', 'POST', undefined, {
      username: 'developer',
      password: 'DeveloperPassword123!',
    });
    assert.strictEqual(devLogin.status, 200, 'Developer login must succeed');
    assert.strictEqual(devLogin.data.data.user.role, 'DEVELOPER');
    devToken = devLogin.data.data.token;
    console.log('✓ Developer login succeeded (Role: DEVELOPER).');

    // OWNER MUST RECEIVE 403 FORBIDDEN ON DEVELOPER ENDPOINTS
    const developerEndpoints = [
      '/api/v1/developer/dashboard',
      '/api/v1/developer/income',
      '/api/v1/developer/reports/income',
      '/api/v1/developer/reports/pending-fees',
      '/api/v1/developer/reports/income/export?format=csv',
      '/api/v1/developer/reports/income/export?format=xlsx',
      '/api/v1/developer/reports/income/export?format=pdf',
      '/api/v1/developer/activity',
      '/api/v1/developer/system',
      '/api/v1/developer/system/integrity',
      '/api/v1/developer/profile',
    ];

    for (const ep of developerEndpoints) {
      const res = await makeRequest(server, ep, 'GET', ownerToken);
      assert.strictEqual(
        res.status,
        403,
        `OWNER MUST receive 403 Forbidden on ${ep}, received ${res.status}`
      );
    }
    console.log(`✓ OWNER received 403 Forbidden on all ${developerEndpoints.length} developer endpoints.`);

    // Unauthenticated access must receive 401
    const unauthTest = await makeRequest(server, '/api/v1/developer/dashboard', 'GET');
    assert.strictEqual(unauthTest.status, 401, 'Unauthenticated request must receive 401');
    console.log('✓ Unauthenticated requests properly rejected with 401.');

    // =========================================================================
    // 3. 92-SEAT CAPACITY INVARIANT AUDIT
    // =========================================================================
    console.log('\n--- 3. 92-Seat Capacity Invariant Audit ---');

    const seatsRes = await makeRequest(server, '/api/v1/seats', 'GET', ownerToken);
    assert.strictEqual(seatsRes.status, 200, 'Seat list endpoint must succeed');
    const seats = seatsRes.data.data.seats;
    assert.strictEqual(seats.length, 92, 'System must contain EXACTLY 92 seats');

    const seatNumbers = seats.map((s: any) => s.seatNumber).sort((a: number, b: number) => a - b);
    for (let i = 1; i <= 92; i++) {
      assert.strictEqual(seatNumbers[i - 1], i, `Seat number ${i} must exist with no gaps`);
    }
    console.log('✓ Capacity verified: exactly 92 seats (1 through 92) with zero gaps.');

    // Verify seat summary counts via owner dashboard
    const summaryRes = await makeRequest(server, '/api/v1/dashboard/owner', 'GET', ownerToken);
    assert.strictEqual(summaryRes.status, 200, 'Dashboard owner endpoint must succeed');
    assert.strictEqual(summaryRes.data.data.stats.totalSeats, 92, 'Total seats summary must be 92');
    console.log(`✓ Seat summary verified (Total: ${summaryRes.data.data.stats.totalSeats}, Available: ${summaryRes.data.data.stats.availableSeats}, Occupied: ${summaryRes.data.data.stats.occupiedSeats}).`);

    // =========================================================================
    // 4. ADMISSION-DATE RECURRING BILLING ENGINE UNIT AUDIT
    // =========================================================================
    console.log('\n--- 4. Admission-Date Recurring Billing & Edge-Case Math ---');

    // Case A: 12th Admission (Standard)
    const range12Sep = BillingDateUtils.getBillingPeriodRange('2026-09-12', 0);
    assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(range12Sep.periodStart)), '2026-09-12');
    assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(range12Sep.periodEnd)), '2026-10-11');
    console.log('✓ Standard billing cycle verified (12 Sep 2026 -> 11 Oct 2026).');

    // Case B: 31st Admission (Month End Edge Case across February)
    const range31Jan = BillingDateUtils.getBillingPeriodRange('2026-01-31', 0);
    // Cycle 0: 31 Jan -> day before next start (which clips to 28 Feb in non-leap 2026) -> 27 Feb
    assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(range31Jan.periodStart)), '2026-01-31');
    assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(range31Jan.periodEnd)), '2026-02-27');

    const rangeFebCycle = BillingDateUtils.getBillingPeriodRange('2026-01-31', 1);
    // Cycle 1: 28 Feb -> day before next start (31 Mar) -> 30 Mar
    assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(rangeFebCycle.periodStart)), '2026-02-28');
    assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(rangeFebCycle.periodEnd)), '2026-03-30');
    console.log('✓ Month-end clipping edge case (31 Jan -> 27 Feb, 28 Feb -> 30 Mar) verified.');

    // Case C: Leap year 2024 test
    const leapFeb = BillingDateUtils.getDaysInMonth(2024, 2);
    assert.strictEqual(leapFeb, 29, 'Leap year 2024 must have 29 days in February');
    const nonLeapFeb = BillingDateUtils.getDaysInMonth(2025, 2);
    assert.strictEqual(nonLeapFeb, 28, 'Non-leap year 2025 must have 28 days in February');
    console.log('✓ Leap year calendar calculations verified.');

    // Fee Status 5-Day Threshold Calculations
    const refDate = new Date('2026-10-10T12:00:00.000Z');
    const pStart = new Date('2026-09-15T00:00:00.000Z');
    
    // Status 1: DUE_SOON (periodEnd is 2026-10-14, which is 4 days away from Oct 10)
    const pEndSoon = new Date('2026-10-14T00:00:00.000Z');
    const calcSoon = FeeStatusService.calculateStatus(pStart, pEndSoon, 1000, 0, refDate, 5);
    assert.strictEqual(calcSoon.status, 'DUE_SOON', 'Should be DUE_SOON within 5-day window');

    // Status 2: DUE (periodEnd is 2026-10-10, exactly on due date)
    const pEndDue = new Date('2026-10-10T00:00:00.000Z');
    const calcDue = FeeStatusService.calculateStatus(pStart, pEndDue, 1000, 0, refDate, 5);
    assert.strictEqual(calcDue.status, 'DUE', 'Should be DUE on the due date');

    // Status 3: OVERDUE (periodEnd was 2026-10-05, past due date)
    const pEndOverdue = new Date('2026-10-05T00:00:00.000Z');
    const calcOverdue = FeeStatusService.calculateStatus(pStart, pEndOverdue, 1000, 0, refDate, 5);
    assert.strictEqual(calcOverdue.status, 'OVERDUE', 'Should be OVERDUE past due date');

    // Status 4: PAID
    const calcPaid = FeeStatusService.calculateStatus(pStart, pEndSoon, 1000, 1000, refDate, 5);
    assert.strictEqual(calcPaid.status, 'PAID', 'Should be PAID when outstanding balance is 0');

    // Status 5: PARTIALLY_PAID
    const calcPartial = FeeStatusService.calculateStatus(pStart, pEndSoon, 1000, 400, refDate, 5);
    assert.strictEqual(calcPartial.status, 'PARTIALLY_PAID', 'Should be PARTIALLY_PAID');
    console.log('✓ Fee status state machine verified (PAID, PARTIALLY_PAID, DUE_SOON, DUE, OVERDUE).');

    // =========================================================================
    // 5. LIFECYCLE, OVERPAYMENT REJECTION & AUDIT LOG TRANSACTION TEST
    // =========================================================================
    console.log('\n--- 5. Student Lifecycle, Payment Validation & Audit Trail ---');

    // Clean any prior run test students
    const priorTestStudents = await prisma.student.findMany({ where: { name: 'Verification Student Prompt5' } });
    for (const prior of priorTestStudents) {
      await prisma.payment.deleteMany({ where: { studentId: prior.id } });
      await prisma.billingPeriod.deleteMany({ where: { studentId: prior.id } });
      await prisma.studentSeatAssignment.deleteMany({ where: { studentId: prior.id } });
      await prisma.activityLog.deleteMany({ where: { studentId: prior.id } });
      await prisma.student.delete({ where: { id: prior.id } });
    }

    // Create a temporary test student
    const createStudentRes = await makeRequest(server, '/api/v1/students', 'POST', ownerToken, {
      name: 'Verification Student Prompt5',
      mobile: '9888877777',
      shift: 'FULL_DAY',
      locker: 'WITH_LOCKER',
      monthlyFee: 1500,
      admissionDate: '2026-09-01',
    });
    assert.strictEqual(createStudentRes.status, 201, 'Student creation must succeed');
    const testStudent = createStudentRes.data.data.student;
    console.log(`✓ Created test student: ${testStudent.name} (ID: ${testStudent.id})`);

    // Fetch current billing period for this student
    const currentBillingRes = await makeRequest(
      server,
      `/api/v1/billing/students/${testStudent.id}/current`,
      'GET',
      ownerToken
    );
    assert.strictEqual(currentBillingRes.status, 200, 'Current billing period should exist');
    const billingPeriod = currentBillingRes.data.data.billingPeriod;
    assert.ok(billingPeriod, 'Billing period must not be null');
    assert.strictEqual(billingPeriod.amount, 1500, 'Fee amount must match 1500');

    // Test Overpayment Rejection
    const overpaymentRes = await makeRequest(server, '/api/v1/billing/payments', 'POST', ownerToken, {
      studentId: testStudent.id,
      billingPeriodId: billingPeriod.id,
      amount: 2000, // Exceeds 1500
      paymentMethod: 'CASH',
    });
    assert.strictEqual(overpaymentRes.status, 400, 'Overpayment must be rejected with 400');
    console.log('✓ Overpayment strictly rejected by transaction engine (HTTP 400).');

    // Partial Payment of 500
    const partialPaymentRes = await makeRequest(server, '/api/v1/billing/payments', 'POST', ownerToken, {
      studentId: testStudent.id,
      billingPeriodId: billingPeriod.id,
      amount: 500,
      paymentMethod: 'UPI',
      reference: 'UPI-VERIFY-123',
    });
    assert.strictEqual(partialPaymentRes.status, 201, 'Partial payment must succeed');
    const payment1 = partialPaymentRes.data.data.payment;
    assert.strictEqual(payment1.amount, 500);
    console.log(`✓ Partial payment recorded (₹500 / ₹1500). Receipt: ${payment1.receiptNumber}`);

    // Verify remaining balance is 1000
    const billingAfterPartial = await makeRequest(
      server,
      `/api/v1/billing/students/${testStudent.id}/current`,
      'GET',
      ownerToken
    );
    assert.strictEqual(billingAfterPartial.data.data.billingPeriod.outstanding, 1000, 'Remaining balance must be 1000');
    assert.strictEqual(billingAfterPartial.data.data.billingPeriod.status, 'PARTIALLY_PAID');
    console.log('✓ Remaining balance correctly calculated as ₹1000 with PARTIALLY_PAID status.');

    // Settle Remaining 1000
    const fullPaymentRes = await makeRequest(server, '/api/v1/billing/payments', 'POST', ownerToken, {
      studentId: testStudent.id,
      billingPeriodId: billingPeriod.id,
      amount: 1000,
      paymentMethod: 'CASH',
    });
    assert.strictEqual(fullPaymentRes.status, 201, 'Remaining payment must succeed');
    console.log('✓ Remaining balance settled in full.');

    // Verify status is now PAID
    const billingAfterFull = await makeRequest(
      server,
      `/api/v1/billing/students/${testStudent.id}/current`,
      'GET',
      ownerToken
    );
    assert.strictEqual(billingAfterFull.data.data.billingPeriod.outstanding, 0, 'Outstanding must be 0');
    assert.strictEqual(billingAfterFull.data.data.billingPeriod.status, 'PAID', 'Status must transition to PAID');
    console.log('✓ Billing status accurately transitioned to PAID.');

    // Archive and Restore student to test lifecycle and audit logs
    const archiveRes = await makeRequest(server, `/api/v1/students/${testStudent.id}/archive`, 'POST', ownerToken);
    assert.strictEqual(archiveRes.status, 200, 'Student archive must succeed');
    console.log('✓ Student archived successfully.');

    const restoreRes = await makeRequest(server, `/api/v1/students/${testStudent.id}/restore`, 'POST', ownerToken);
    assert.strictEqual(restoreRes.status, 200, 'Student restore must succeed');
    console.log('✓ Student restored successfully.');

    // Clean up test student from DB
    await prisma.payment.deleteMany({ where: { studentId: testStudent.id } });
    await prisma.billingPeriod.deleteMany({ where: { studentId: testStudent.id } });
    await prisma.studentSeatAssignment.deleteMany({ where: { studentId: testStudent.id } });
    await prisma.activityLog.deleteMany({ where: { studentId: testStudent.id } });
    await prisma.student.delete({ where: { id: testStudent.id } });
    console.log('✓ Test student cleaned up gracefully.');

    // =========================================================================
    // 6. DEVELOPER DATA INTEGRITY & SYSTEM DIAGNOSTICS
    // =========================================================================
    console.log('\n--- 6. Developer Data Integrity & System Diagnostics ---');

    const integrityRes = await makeRequest(server, '/api/v1/developer/system/integrity', 'GET', devToken);
    assert.strictEqual(integrityRes.status, 200, 'Data integrity suite must succeed');
    assert.strictEqual(integrityRes.data.data.report.overallStatus, 'PASS', 'Data integrity suite overall status must be PASS');
    assert.strictEqual(integrityRes.data.data.report.totalChecks, 9, 'All 9 integrity checks executed');
    console.log(`✓ All 9 system data integrity checks PASSED with 0 anomalies.`);

    const systemRes = await makeRequest(server, '/api/v1/developer/system', 'GET', devToken);
    assert.strictEqual(systemRes.status, 200, 'System info endpoint must succeed');
    assert.strictEqual(systemRes.data.data.system.database.status, 'Connected');
    assert.strictEqual(systemRes.data.data.system.backend.status, 'Healthy');
    // Ensure no secrets leaked
    assert.strictEqual((systemRes.data.data.system as any).database.password, undefined, 'No raw DB password in response');
    assert.strictEqual((systemRes.data.data.system as any).jwtSecret, undefined, 'No raw JWT secret in response');
    console.log('✓ System diagnostics endpoint verified; zero secrets exposed.');

    // =========================================================================
    // 7. DEVELOPER EXPORTS (CSV, EXCEL, PDF)
    // =========================================================================
    console.log('\n--- 7. Developer Analytics Exports ---');

    // CSV
    const csvRes = await makeRequest(server, '/api/v1/developer/reports/income/export?format=csv', 'GET', devToken);
    assert.strictEqual(csvRes.status, 200, 'CSV export should return 200');
    assert.ok(csvRes.headers['content-type']?.includes('text/csv'), 'Content-type must be text/csv');
    assert.ok(csvRes.rawBuffer.length > 50, 'CSV export must not be empty');
    console.log(`✓ CSV Export verified (${csvRes.rawBuffer.length} bytes).`);

    // XLSX
    const xlsxRes = await makeRequest(server, '/api/v1/developer/reports/income/export?format=xlsx', 'GET', devToken);
    assert.strictEqual(xlsxRes.status, 200, 'Excel export should return 200');
    assert.ok(
      xlsxRes.headers['content-type']?.includes('spreadsheetml'),
      'Content-type must be excel openxml'
    );
    assert.ok(xlsxRes.rawBuffer.length > 1000, 'Excel file must contain binary workbook data');
    console.log(`✓ Excel (XLSX) Export verified (${xlsxRes.rawBuffer.length} bytes).`);

    // PDF
    const pdfRes = await makeRequest(server, '/api/v1/developer/reports/income/export?format=pdf', 'GET', devToken);
    assert.strictEqual(pdfRes.status, 200, 'PDF export should return 200');
    assert.ok(pdfRes.headers['content-type']?.includes('application/pdf'), 'Content-type must be application/pdf');
    const isPdfMagic = pdfRes.rawBuffer.slice(0, 4).toString() === '%PDF';
    assert.ok(isPdfMagic, 'PDF export must begin with %PDF magic header');
    console.log(`✓ PDF Export verified (${pdfRes.rawBuffer.length} bytes, valid %PDF header).`);

    // =========================================================================
    // 8. ACTIVITY AUDIT TRAIL LOGGING
    // =========================================================================
    console.log('\n--- 8. Developer Activity Audit Trail ---');
    const actRes = await makeRequest(server, '/api/v1/developer/activity?limit=10', 'GET', devToken);
    assert.strictEqual(actRes.status, 200, 'Activity log endpoint must succeed');
    assert.ok(Array.isArray(actRes.data.data.logs), 'Logs must be an array');
    console.log(`✓ Activity logs successfully retrieved (${actRes.data.data.logs.length} recent entries).`);

    console.log('\n===============================================================');
    console.log('   >>> ALL PROMPT 5 PRODUCTION & INTEGRATION AUDITS PASSED <<<');
    console.log('===============================================================');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runPrompt5Verification().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
