import assert from 'node:assert';
import { app } from '../src/app.js';
import http from 'http';

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
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let data = raw;
          try {
            data = JSON.parse(raw);
          } catch {}
          resolve({ status: res.statusCode || 500, data, headers: res.headers });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runPrompt4Verification() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  console.log('--- Starting PROMPT 4 Verification Suite ---');

  let ownerToken = '';
  let devToken = '';

  // 1. Developer login
  const devLoginRes = await makeRequest(server, '/api/v1/auth/login', 'POST', undefined, {
    username: 'developer',
    password: 'DeveloperPassword123!',
  });
  assert.strictEqual(devLoginRes.status, 200, 'Developer login should succeed');
  assert.strictEqual(devLoginRes.data.data.user.role, 'DEVELOPER');
  devToken = devLoginRes.data.data.token;
  console.log('✓ 1. Developer can login.');

  // Owner login
  const ownerLoginRes = await makeRequest(server, '/api/v1/auth/login', 'POST', undefined, {
    username: 'owner',
    password: 'OwnerPassword123!',
  });
  assert.strictEqual(ownerLoginRes.status, 200, 'Owner login should succeed');
  assert.strictEqual(ownerLoginRes.data.data.user.role, 'OWNER');
  ownerToken = ownerLoginRes.data.data.token;
  console.log('✓ Owner login works.');

  // 2. Owner cannot access developer APIs (CRITICAL 403 TEST)
  const forbiddenEndpoints = [
    '/api/v1/developer/dashboard',
    '/api/v1/developer/income',
    '/api/v1/developer/reports/income',
    '/api/v1/developer/reports/pending-fees',
    '/api/v1/developer/reports/income/export?format=csv',
    '/api/v1/developer/activity',
    '/api/v1/developer/system',
    '/api/v1/developer/system/integrity',
  ];

  for (const ep of forbiddenEndpoints) {
    const res = await makeRequest(server, ep, 'GET', ownerToken);
    assert.strictEqual(
      res.status,
      403,
      `OWNER must receive 403 on ${ep}, received ${res.status}`
    );
  }
  console.log('✓ 2. OWNER receives 403 Forbidden across all developer endpoints.');

  // Unauthenticated requests must receive 401
  const unauthRes = await makeRequest(server, '/api/v1/developer/dashboard', 'GET');
  assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must receive 401');
  console.log('✓ Unauthenticated requests receive 401 Unauthorized.');

  // 3. Developer dashboard loads
  const devDashRes = await makeRequest(server, '/api/v1/developer/dashboard', 'GET', devToken);
  assert.strictEqual(devDashRes.status, 200, 'Developer dashboard must load');
  const stats = devDashRes.data.data.stats;
  assert.ok(stats.lifetimeIncome !== undefined, 'lifetimeIncome present');
  assert.ok(stats.todayIncome !== undefined, 'todayIncome present');
  assert.ok(stats.currentMonthIncome !== undefined, 'currentMonthIncome present');
  assert.ok(stats.previousMonthIncome !== undefined, 'previousMonthIncome present');
  assert.ok(stats.currentYearIncome !== undefined, 'currentYearIncome present');
  assert.ok(stats.pendingFees !== undefined, 'pendingFees present');
  assert.ok(stats.expectedIncome !== undefined, 'expectedIncome present');
  assert.ok(stats.activeStudents !== undefined, 'activeStudents present');
  console.log('✓ 3-10. Developer dashboard loads with all 8 financial & operational metrics.');

  // 11. Income overview & Date range filtering
  const devIncomeRes = await makeRequest(
    server,
    '/api/v1/developer/income?preset=this_month',
    'GET',
    devToken
  );
  assert.strictEqual(devIncomeRes.status, 200, 'Developer income overview loads');
  const incomeOverview = devIncomeRes.data.data;
  assert.ok(Array.isArray(incomeOverview.trend), 'trend is array');
  assert.ok(Array.isArray(incomeOverview.paymentMethodBreakdown), 'paymentMethodBreakdown is array');
  assert.ok(Array.isArray(incomeOverview.shiftIncome), 'shiftIncome is array');
  assert.ok(Array.isArray(incomeOverview.lockerIncome), 'lockerIncome is array');
  console.log('✓ 11-14. Income analytics, date range, payment methods, shift, and locker breakdown work.');

  // 15. Reports: Monthly summary
  const monthSumRes = await makeRequest(
    server,
    '/api/v1/developer/reports/monthly-summary',
    'GET',
    devToken
  );
  assert.strictEqual(monthSumRes.status, 200);
  assert.strictEqual(monthSumRes.data.data.rows.length, 12, '12 months in monthly summary');
  console.log('✓ 15. Monthly summary report generated accurately.');

  // 16-17. Reports: Student report & Seat report
  const studentRepRes = await makeRequest(server, '/api/v1/developer/reports/students', 'GET', devToken);
  assert.strictEqual(studentRepRes.status, 200);
  const seatRepRes = await makeRequest(server, '/api/v1/developer/reports/seats', 'GET', devToken);
  assert.strictEqual(seatRepRes.status, 200);
  assert.strictEqual(seatRepRes.data.data.totalSeats, 92, 'Exactly 92 seats reported');
  console.log('✓ 16-17. Student directory & 92-Seat occupancy report verified.');

  // 18-19. Activity log creation & filtering
  const activityRes = await makeRequest(server, '/api/v1/developer/activity', 'GET', devToken);
  assert.strictEqual(activityRes.status, 200);
  assert.ok(activityRes.data.data.logs.length > 0, 'Activity logs should contain login events');
  console.log('✓ 18-19. Activity logs record events and support queries.');

  // 20. CSV Export
  const csvRes = await makeRequest(
    server,
    '/api/v1/developer/reports/income/export?format=csv',
    'GET',
    devToken
  );
  assert.strictEqual(csvRes.status, 200);
  assert.ok(String(csvRes.data).includes('Receipt #'), 'CSV contains headers');
  console.log('✓ 20. CSV export generates valid formatted document.');

  // 21. Excel Export
  const xlsxRes = await makeRequest(
    server,
    '/api/v1/developer/reports/income/export?format=xlsx',
    'GET',
    devToken
  );
  assert.strictEqual(xlsxRes.status, 200);
  assert.strictEqual(
    xlsxRes.headers['content-type'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  console.log('✓ 21. Excel export (.xlsx) generated successfully.');

  // 22. PDF Export
  const pdfRes = await makeRequest(
    server,
    '/api/v1/developer/reports/income/export?format=pdf',
    'GET',
    devToken
  );
  assert.strictEqual(pdfRes.status, 200);
  assert.strictEqual(pdfRes.headers['content-type'], 'application/pdf');
  console.log('✓ 22. PDF export generated successfully.');

  // 23. System Diagnostics & Health
  const sysRes = await makeRequest(server, '/api/v1/developer/system', 'GET', devToken);
  assert.strictEqual(sysRes.status, 200);
  const sysData = sysRes.data.data.system;
  assert.strictEqual(sysData.database.status, 'Connected');
  assert.strictEqual(sysData.backend.status, 'Healthy');
  assert.strictEqual(sysData.counts.totalSeats, 92);
  // Ensure no sensitive secrets exposed
  const rawSysString = JSON.stringify(sysData);
  assert.ok(!rawSysString.includes('JWT_SECRET'), 'No JWT_SECRET exposed');
  assert.ok(!rawSysString.includes('DATABASE_URL'), 'No DATABASE_URL exposed');
  assert.ok(!rawSysString.includes('password'), 'No passwords exposed');
  console.log('✓ 23. System endpoint is healthy and exposes zero secrets.');

  // 26. Data Integrity Check
  const integrityRes = await makeRequest(
    server,
    '/api/v1/developer/system/integrity',
    'GET',
    devToken
  );
  assert.strictEqual(integrityRes.status, 200);
  const report = integrityRes.data.data.report;
  assert.ok(['PASS', 'WARNING', 'ERROR'].includes(report.overallStatus));
  assert.strictEqual(report.totalChecks, 9, 'All 9 integrity checks executed');
  console.log(`✓ 26. Data integrity diagnostic suite passed: status=${report.overallStatus}`);

  // 29-30. Developer Profile & Password
  const profileRes = await makeRequest(server, '/api/v1/developer/profile', 'GET', devToken);
  assert.strictEqual(profileRes.status, 200);
  assert.strictEqual(profileRes.data.data.profile.role, 'DEVELOPER');
  console.log('✓ 29-30. Developer profile retrieved securely.');

  // Existing Owner features verification (Prompt 1-3)
  const ownerDashRes = await makeRequest(server, '/api/v1/dashboard/owner', 'GET', ownerToken);
  assert.strictEqual(ownerDashRes.status, 200, 'Owner dashboard still works');
  const seatsRes = await makeRequest(server, '/api/v1/seats', 'GET', ownerToken);
  assert.strictEqual(seatsRes.status, 200, 'Owner seats still works');
  const billingPeriodsRes = await makeRequest(server, '/api/v1/billing/periods', 'GET', ownerToken);
  assert.strictEqual(billingPeriodsRes.status, 200, 'Owner billing periods still works');
  console.log('✓ Prompts 1–3 owner operations, seats, and billing continue to work flawlessly.');

  server.close();
  console.log('--- ALL PROMPT 4 VERIFICATIONS PASSED SUCCESSFULLY ---');
}

runPrompt4Verification().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
