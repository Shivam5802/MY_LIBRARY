import assert from 'node:assert';
import http from 'http';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

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
): Promise<{ status: number; data: any; headers: http.IncomingHttpHeaders }> {
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
          const rawStr = Buffer.concat(chunks).toString('utf-8');
          let data: any = rawStr;
          try {
            data = JSON.parse(rawStr);
          } catch {}
          resolve({
            status: res.statusCode || 500,
            data,
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

async function runFeeCycleVerification() {
  console.log('========================================================================');
  console.log('  MY LIBRARY - COMPREHENSIVE FEE CYCLE & 5-DAY ALERT VERIFICATION SUITE');
  console.log('========================================================================');

  // =========================================================================
  // SECTION 1: CENTRALIZED DATE UTILS & DD-MM-YYYY FORMAT
  // =========================================================================
  console.log('\n--- Section 1: Centralized Date Utils & DD-MM-YYYY Strict Formatting ---');

  // Format tests
  assert.strictEqual(BillingDateUtils.formatDate('2026-09-10'), '10-09-2026', '2026-09-10 must format to 10-09-2026');
  assert.strictEqual(BillingDateUtils.formatDate('2026-01-05'), '05-01-2026', '2026-01-05 must format to 05-01-2026');
  assert.strictEqual(BillingDateUtils.formatDate('2026-12-31'), '31-12-2026', '2026-12-31 must format to 31-12-2026');
  assert.strictEqual(BillingDateUtils.formatDate(new Date(2026, 8, 10)), '10-09-2026', 'Date object must format to 10-09-2026');
  assert.strictEqual(BillingDateUtils.formatDate(null), '—', 'Null must format to —');
  console.log('✓ formatDate utility strictly emits DD-MM-YYYY across all variations.');

  // =========================================================================
  // SECTION 2: BILLING PERIOD RANGE & DUE DATE CALCULATIONS (CENTRALIZED ENGINE)
  // =========================================================================
  console.log('\n--- Section 2: Billing Period Range & Due Date Calculations ---');

  // Case 1: Standard month (10 Sep 2026)
  // Cycle 0: Period: 10 Sep 2026 -> 09 Oct 2026, Due Date: 10 Oct 2026
  const cycle10Sep = BillingDateUtils.getBillingPeriodRange('2026-09-10', 0);
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycle10Sep.periodStart)), '2026-09-10');
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycle10Sep.periodEnd)), '2026-10-09');
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycle10Sep.dueDate)), '2026-10-10');
  assert.strictEqual(BillingDateUtils.formatDate(cycle10Sep.periodStart), '10-09-2026');
  assert.strictEqual(BillingDateUtils.formatDate(cycle10Sep.periodEnd), '09-10-2026');
  assert.strictEqual(BillingDateUtils.formatDate(cycle10Sep.dueDate), '10-10-2026');
  console.log('✓ Standard 10 Sep cycle: Period 10-09-2026 to 09-10-2026, Due 10-10-2026.');

  // Cycle 1: Period: 10 Oct 2026 -> 09 Nov 2026, Due Date: 10 Nov 2026
  const cycle10Oct = BillingDateUtils.getBillingPeriodRange('2026-09-10', 1);
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycle10Oct.periodStart)), '2026-10-10');
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycle10Oct.periodEnd)), '2026-11-09');
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycle10Oct.dueDate)), '2026-11-10');
  console.log('✓ Second cycle (index 1): Period 10-10-2026 to 09-11-2026, Due 10-11-2026.');

  // Case 2: 31st Day Edge Cases (31 Jan in non-leap year 2026)
  // Next anniversary for Jan 31 in Feb 2026 is Feb 28.
  // Period 0: 31 Jan 2026 -> 27 Feb 2026, Due Date: 28 Feb 2026
  const cycle31Jan2026 = BillingDateUtils.getBillingPeriodRange('2026-01-31', 0);
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycle31Jan2026.periodStart)), '2026-01-31');
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycle31Jan2026.periodEnd)), '2026-02-27');
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycle31Jan2026.dueDate)), '2026-02-28');
  console.log('✓ Non-leap year 31 Jan: Period 31-01-2026 to 27-02-2026, Due 28-02-2026.');

  // Next cycle (index 1): 28 Feb 2026 -> 30 Mar 2026, Due Date: 31 Mar 2026
  const cycleFeb2026 = BillingDateUtils.getBillingPeriodRange('2026-01-31', 1);
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycleFeb2026.periodStart)), '2026-02-28');
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycleFeb2026.periodEnd)), '2026-03-30');
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycleFeb2026.dueDate)), '2026-03-31');
  console.log('✓ Follow-up Feb cycle: Period 28-02-2026 to 30-03-2026, Due 31-03-2026.');

  // Case 3: Leap Year 2024 (31 Jan in leap year)
  // Feb 2024 has 29 days. Anniversary clips to 29 Feb.
  // Period 0: 31 Jan 2024 -> 28 Feb 2024, Due Date: 29 Feb 2024
  const cycle31Jan2024 = BillingDateUtils.getBillingPeriodRange('2024-01-31', 0);
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycle31Jan2024.periodStart)), '2024-01-31');
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycle31Jan2024.periodEnd)), '2024-02-28');
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycle31Jan2024.dueDate)), '2024-02-29');
  console.log('✓ Leap year 31 Jan: Period 31-01-2024 to 28-02-2024, Due 29-02-2024.');

  // Case 4: 31st Day to 30-day month (31 Mar -> 30 Apr)
  const cycle31Mar = BillingDateUtils.getBillingPeriodRange('2026-03-31', 0);
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycle31Mar.periodStart)), '2026-03-31');
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycle31Mar.periodEnd)), '2026-04-29');
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycle31Mar.dueDate)), '2026-04-30');
  console.log('✓ Month-end 31 Mar -> 30 Apr: Period 31-03-2026 to 29-04-2026, Due 30-04-2026.');

  // Case 5: 31 Aug -> 30 Sep
  const cycle31Aug = BillingDateUtils.getBillingPeriodRange('2026-08-31', 0);
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycle31Aug.periodStart)), '2026-08-31');
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycle31Aug.periodEnd)), '2026-09-29');
  assert.strictEqual(BillingDateUtils.toDateString(BillingDateUtils.parseCalendarDate(cycle31Aug.dueDate)), '2026-09-30');
  console.log('✓ Month-end 31 Aug -> 30 Sep: Period 31-08-2026 to 29-09-2026, Due 30-09-2026.');

  // =========================================================================
  // SECTION 3: 5-DAY ALERT STATE MACHINE & FEE STATUS SERVICE
  // =========================================================================
  console.log('\n--- Section 3: 5-Day Alert State Machine & Fee Status Rules ---');

  const refToday = new Date('2026-10-10T12:00:00.000Z'); // Current simulated date
  const periodStartRef = new Date('2026-09-10T00:00:00.000Z');
  const periodEndRef = new Date('2026-10-09T00:00:00.000Z');

  // Test 3.1: 6 days before Due Date -> Status DUE (not in alert)
  const dueDate6DaysAway = new Date('2026-10-16T00:00:00.000Z');
  const res6Days = FeeStatusService.calculateStatus(periodStartRef, periodEndRef, 1000, 0, refToday, 5, dueDate6DaysAway);
  assert.strictEqual(res6Days.daysRemaining, 6, '6 days remaining');
  assert.strictEqual(res6Days.status, 'DUE', '6 days remaining should have status DUE (outside 5-day alert)');
  console.log('✓ 6 days remaining: Status DUE (outside 5-day alert window).');

  // Test 3.2: 5 days before Due Date -> Status DUE_SOON (starts exactly on day 5)
  const dueDate5DaysAway = new Date('2026-10-15T00:00:00.000Z');
  const res5Days = FeeStatusService.calculateStatus(periodStartRef, periodEndRef, 1000, 0, refToday, 5, dueDate5DaysAway);
  assert.strictEqual(res5Days.daysRemaining, 5, '5 days remaining');
  assert.strictEqual(res5Days.status, 'DUE_SOON', '5 days remaining must trigger DUE_SOON');
  console.log('✓ 5 days remaining: Status DUE_SOON (alert window entry).');

  // Test 3.3: 4 days before Due Date -> Status DUE_SOON
  const dueDate4DaysAway = new Date('2026-10-14T00:00:00.000Z');
  const res4Days = FeeStatusService.calculateStatus(periodStartRef, periodEndRef, 1000, 0, refToday, 5, dueDate4DaysAway);
  assert.strictEqual(res4Days.daysRemaining, 4);
  assert.strictEqual(res4Days.status, 'DUE_SOON');
  console.log('✓ 4 days remaining: Status DUE_SOON.');

  // Test 3.4: 1 day before Due Date -> Status DUE_SOON
  const dueDate1DayAway = new Date('2026-10-11T00:00:00.000Z');
  const res1Day = FeeStatusService.calculateStatus(periodStartRef, periodEndRef, 1000, 0, refToday, 5, dueDate1DayAway);
  assert.strictEqual(res1Day.daysRemaining, 1);
  assert.strictEqual(res1Day.status, 'DUE_SOON');
  console.log('✓ 1 day remaining: Status DUE_SOON.');

  // Test 3.5: 0 days remaining (Due Date is TODAY) -> Status DUE
  const dueDateToday = new Date('2026-10-10T00:00:00.000Z');
  const resToday = FeeStatusService.calculateStatus(periodStartRef, periodEndRef, 1000, 0, refToday, 5, dueDateToday);
  assert.strictEqual(resToday.daysRemaining, 0);
  assert.strictEqual(resToday.status, 'DUE', 'Due Date today with unpaid fee must be DUE');
  console.log('✓ 0 days remaining (Due Date is today): Status DUE.');

  // Test 3.6: -1 days remaining (Past Due Date) -> Status OVERDUE
  const dueDateYesterday = new Date('2026-10-09T00:00:00.000Z');
  const resOverdue = FeeStatusService.calculateStatus(periodStartRef, periodEndRef, 1000, 0, refToday, 5, dueDateYesterday);
  assert.strictEqual(resOverdue.daysRemaining, -1);
  assert.strictEqual(resOverdue.status, 'OVERDUE', 'Past due date with unpaid fee must be OVERDUE');
  console.log('✓ -1 days remaining: Status OVERDUE.');

  // Test 3.7: Paid in full -> Status PAID
  const resPaid = FeeStatusService.calculateStatus(periodStartRef, periodEndRef, 1000, 1000, refToday, 5, dueDate5DaysAway);
  assert.strictEqual(resPaid.status, 'PAID', 'Zero balance must be PAID regardless of due date');
  console.log('✓ Paid in full: Status PAID.');

  // Test 3.8: Partial payment before due date -> Status PARTIALLY_PAID
  const resPartialDueSoon = FeeStatusService.calculateStatus(periodStartRef, periodEndRef, 1000, 400, refToday, 5, dueDate5DaysAway);
  assert.strictEqual(resPartialDueSoon.status, 'PARTIALLY_PAID', 'Partial payment with daysRemaining > 0 is PARTIALLY_PAID');
  console.log('✓ Partial payment with daysRemaining > 0: Status PARTIALLY_PAID.');

  // =========================================================================
  // SECTION 4: INTEGRATION TEST VIA LIVE HTTP SERVER & PRISMA DB
  // =========================================================================
  console.log('\n--- Section 4: Live HTTP Server, Prisma DB & Business Rules Integration ---');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  try {
    // 4.1 Owner Login
    const ownerLogin = await makeRequest(server, '/api/v1/auth/login', 'POST', undefined, {
      username: 'owner',
      password: 'OwnerPassword123!',
    });
    assert.strictEqual(ownerLogin.status, 200, 'Owner login must succeed');
    const ownerToken = ownerLogin.data.data.token;

    // 4.2 Developer Login
    const devLogin = await makeRequest(server, '/api/v1/auth/login', 'POST', undefined, {
      username: 'developer',
      password: 'DeveloperPassword123!',
    });
    assert.strictEqual(devLogin.status, 200, 'Developer login must succeed');
    const devToken = devLogin.data.data.token;

    // 4.3 Validation: Reject when feeCycleStartDate < admissionDate
    const invalidDateRes = await makeRequest(server, '/api/v1/students', 'POST', ownerToken, {
      name: 'Invalid Date Student',
      mobile: '9888800001',
      shift: 'FULL_DAY',
      locker: 'WITHOUT_LOCKER',
      monthlyFee: 1000,
      admissionDate: '2026-09-10',
      feeCycleStartDate: '2026-09-05', // earlier than admission date
    });
    assert.strictEqual(invalidDateRes.status, 400, 'feeCycleStartDate < admissionDate must be rejected with 400');
    console.log('✓ Validation rule enforced: feeCycleStartDate < admissionDate rejected (HTTP 400).');

    // 4.4 Validation: Reject monthlyFee <= 0
    const invalidFeeRes = await makeRequest(server, '/api/v1/students', 'POST', ownerToken, {
      name: 'Invalid Fee Student',
      mobile: '9888800002',
      shift: 'FULL_DAY',
      locker: 'WITHOUT_LOCKER',
      monthlyFee: 0,
      admissionDate: '2026-09-10',
      feeCycleStartDate: '2026-09-10',
    });
    assert.strictEqual(invalidFeeRes.status, 400, 'monthlyFee <= 0 must be rejected with 400');
    console.log('✓ Validation rule enforced: monthlyFee <= 0 rejected (HTTP 400).');

    // Clean any prior test student
    const existingStudents = await prisma.student.findMany({
      where: { mobile: { in: ['9888812345', '9888812346'] } },
    });
    for (const s of existingStudents) {
      await prisma.payment.deleteMany({ where: { studentId: s.id } });
      await prisma.billingPeriod.deleteMany({ where: { studentId: s.id } });
      await prisma.studentSeatAssignment.deleteMany({ where: { studentId: s.id } });
      await prisma.activityLog.deleteMany({ where: { studentId: s.id } });
      await prisma.student.delete({ where: { id: s.id } });
    }

    // 4.5 Register student with admissionDate: 01-09-2026 and feeCycleStartDate: 10-09-2026
    const createRes = await makeRequest(server, '/api/v1/students', 'POST', ownerToken, {
      name: 'Fee Cycle Integration Student',
      mobile: '9888812345',
      shift: 'FULL_DAY',
      locker: 'WITH_LOCKER',
      monthlyFee: 1200,
      admissionDate: '2026-09-01',
      feeCycleStartDate: '2026-09-10',
    });
    assert.strictEqual(createRes.status, 201, 'Student creation must succeed');
    const createdStudent = createRes.data.data.student;
    assert.strictEqual(createdStudent.name, 'Fee Cycle Integration Student');
    assert.ok(createdStudent.feeCycleStartDate.startsWith('2026-09-10'), 'feeCycleStartDate must be 2026-09-10');
    assert.ok(createdStudent.admissionDate.startsWith('2026-09-01'), 'admissionDate must be 2026-09-01');
    console.log('✓ Student registered: admissionDate=01-09-2026, feeCycleStartDate=10-09-2026.');

    // 4.6 Inspect the generated billing period
    const currentBillingRes = await makeRequest(
      server,
      `/api/v1/billing/students/${createdStudent.id}/current`,
      'GET',
      ownerToken
    );
    assert.strictEqual(currentBillingRes.status, 200, 'Current billing must exist');
    const bp = currentBillingRes.data.data.billingPeriod;
    assert.ok(bp, 'Billing period must exist');

    // Period starts from feeCycleStartDate (2026-09-10)
    assert.ok(bp.periodStart.startsWith('2026-09-10'), `Period start must be 2026-09-10, got ${bp.periodStart}`);
    // Period ends 1 day before due date (2026-10-09)
    assert.ok(bp.periodEnd.startsWith('2026-10-09'), `Period end must be 2026-10-09, got ${bp.periodEnd}`);
    // Due Date is next monthly anniversary (2026-10-10)
    assert.ok(bp.dueDate.startsWith('2026-10-10'), `Due date must be 2026-10-10, got ${bp.dueDate}`);
    console.log(`✓ First Billing Period verified: Start=${BillingDateUtils.formatDate(bp.periodStart)}, End=${BillingDateUtils.formatDate(bp.periodEnd)}, Due=${BillingDateUtils.formatDate(bp.dueDate)}`);

    // 4.7 WhatsApp Reminder Formatting
    const waReminderRes = await makeRequest(
      server,
      `/api/v1/billing/whatsapp/prepare?studentId=${createdStudent.id}&billingPeriodId=${bp.id}`,
      'GET',
      ownerToken
    );
    assert.strictEqual(waReminderRes.status, 200, 'WhatsApp preview must succeed');
    const waMessage = waReminderRes.data.data.formattedMessage;
    assert.ok(waMessage && waMessage.includes('10-10-2026'), 'WhatsApp reminder must contain due date formatted as DD-MM-YYYY (10-10-2026)');
    console.log('✓ WhatsApp reminder uses centralized DD-MM-YYYY format: includes "10-10-2026".');

    // 4.8 Owner Dashboard: Verify feesDueSoon metric is present
    const dashboardRes = await makeRequest(server, '/api/v1/dashboard/owner', 'GET', ownerToken);
    assert.strictEqual(dashboardRes.status, 200);
    assert.ok(dashboardRes.data.data.stats.feesDueSoon !== undefined, 'feesDueSoon metric must exist on owner dashboard');
    console.log(`✓ Owner dashboard includes feesDueSoon=${dashboardRes.data.data.stats.feesDueSoon}.`);

    // 4.9 Developer Student Report: Verify feeCycleStartDate is included
    const studentReportRes = await makeRequest(server, '/api/v1/developer/reports/students', 'GET', devToken);
    assert.strictEqual(studentReportRes.status, 200);
    const studentReportRows = studentReportRes.data.data.rows;
    const reportedStudent = studentReportRows.find((r: any) => r.studentId === createdStudent.id);
    assert.ok(reportedStudent, 'Student must appear in developer report');
    assert.ok(reportedStudent.feeCycleStartDate, 'Report row must include feeCycleStartDate');
    console.log(`✓ Developer Student Report row includes feeCycleStartDate=${reportedStudent.feeCycleStartDate}.`);

    // 4.10 Developer Admissions Report: Verify feeCycleStartDate is included
    const admissionsReportRes = await makeRequest(server, '/api/v1/developer/reports/admissions', 'GET', devToken);
    assert.strictEqual(admissionsReportRes.status, 200);
    const admissionsRows = admissionsReportRes.data.data.rows;
    const admissionRow = admissionsRows.find((r: any) => r.studentId === createdStudent.id);
    assert.ok(admissionRow, 'Student must appear in admissions report');
    assert.ok(admissionRow.feeCycleStartDate, 'Admissions row must include feeCycleStartDate');
    console.log(`✓ Developer Admissions Report row includes feeCycleStartDate=${admissionRow.feeCycleStartDate}.`);

    // 4.11 Clean up test data
    await prisma.payment.deleteMany({ where: { studentId: createdStudent.id } });
    await prisma.billingPeriod.deleteMany({ where: { studentId: createdStudent.id } });
    await prisma.studentSeatAssignment.deleteMany({ where: { studentId: createdStudent.id } });
    await prisma.activityLog.deleteMany({ where: { studentId: createdStudent.id } });
    await prisma.student.delete({ where: { id: createdStudent.id } });
    console.log('✓ Test student cleaned up gracefully from database.');

    console.log('\n========================================================================');
    console.log('   >>> ALL 25 FEE CYCLE & 5-DAY ALERT VERIFICATIONS PASSED (100%) <<<');
    console.log('========================================================================');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runFeeCycleVerification().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
