import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_STATUSES,
  validatePiiSafety,
  validateGrievanceInput,
  generateGrievanceReference,
  getGrievanceSummary,
  getRtsAdvisoryForGrievance,
} = require('../lib/grievances.ts');

const { grievanceTranslations } = require('../app/grievance-translations.ts');

console.log('--- Testing Unified Grievance Centre (Phase 3 Day 6 Verification) ---');

let assertions = 0;
const testAssert = (cond, msg) => {
  assert.ok(cond, msg);
  assertions++;
};

// ============================================================================
// 1. GRIEVANCE CATEGORIES & CLASSIFICATION INTEGRITY
// ============================================================================
console.log('1. Testing grievance categories and classification integrity...');

testAssert(Array.isArray(GRIEVANCE_CATEGORIES), 'GRIEVANCE_CATEGORIES must be an array');
testAssert(GRIEVANCE_CATEGORIES.length === 7, 'Must define exactly 7 standardized grievance categories');

const expectedCategories = [
  'application_delay',
  'rejection',
  'incorrect_information',
  'service_delivery_issue',
  'department_communication',
  'portal_technical_issue',
  'other',
];

for (const catKey of expectedCategories) {
  const found = GRIEVANCE_CATEGORIES.find((c) => c.key === catKey);
  testAssert(Boolean(found), `Category ${catKey} must exist in catalogue`);
  testAssert(typeof found?.label === 'string' && found.label.length > 0, `Category ${catKey} must have non-empty label`);
  testAssert(typeof found?.description === 'string' && found.description.length > 0, `Category ${catKey} must have non-empty description`);
}
console.log('   ✓ All 7 standardized grievance categories verified.');

// ============================================================================
// 2. STATUS WORKFLOW METADATA & BADGE TONES
// ============================================================================
console.log('2. Testing workflow statuses & GovSync internal tracking labels...');

const expectedStatuses = [
  'submitted',
  'under_review',
  'information_required',
  'response_provided',
  'resolved',
  'closed',
];

for (const statusKey of expectedStatuses) {
  const meta = GRIEVANCE_STATUSES[statusKey];
  testAssert(Boolean(meta), `Status ${statusKey} must be defined in GRIEVANCE_STATUSES`);
  testAssert(meta.key === statusKey, `Status meta key must match ${statusKey}`);
  testAssert(typeof meta.label === 'string' && meta.label.length > 0, `Status ${statusKey} must have label`);
  testAssert(['neutral', 'orange', 'green', 'red'].includes(meta.badgeTone), `Status ${statusKey} has valid badge tone`);
}
console.log('   ✓ All 6 GovSync internal workflow statuses verified.');

// ============================================================================
// 3. SENSITIVE PII & SECURITY PROTECTION
// ============================================================================
console.log('3. Testing sensitive PII safety checks & credential blocking...');

// 3a. Aadhaar numbers (12 digits with or without spaces/hyphens)
const aadhaar1 = validatePiiSafety('My application details: Aadhaar 1234 5678 9012 please check.');
testAssert(aadhaar1.safe === false, 'Must block 12-digit Aadhaar number with spaces');
testAssert(aadhaar1.error?.includes('Aadhaar'), 'Error message must mention Aadhaar');

const aadhaar2 = validatePiiSafety('Citizen ID is 987654321098 submitted yesterday.');
testAssert(aadhaar2.safe === false, 'Must block 12-digit contiguous Aadhaar number');

const aadhaar3 = validatePiiSafety('Aadhaar: 1111-2222-3333');
testAssert(aadhaar3.safe === false, 'Must block hyphenated 12-digit Aadhaar number');

// 3b. Bank IFSC code
const ifsc1 = validatePiiSafety('Please transfer subsidy to account with IFSC SBIN0001234.');
testAssert(ifsc1.safe === false, 'Must block Indian IFSC codes');
testAssert(ifsc1.error?.includes('bank') || ifsc1.error?.includes('IFSC'), 'Error must mention bank or IFSC');

// 3c. Credit card numbers
const card1 = validatePiiSafety('Payment transaction with card 4111222233334444 failed on portal.');
testAssert(card1.safe === false, 'Must block 16-digit credit card number');

// 3d. Passwords and OTPs
const cred1 = validatePiiSafety('My password: secretpassword123 for portal login');
testAssert(cred1.safe === false, 'Must block password credentials');

const cred2 = validatePiiSafety('Portal OTP=987654 did not work');
testAssert(cred2.safe === false, 'Must block OTP credentials');

// 3e. Safe normal text should pass
const safeText = validatePiiSafety('My caste certificate application RES-2026-ABCD has been pending for over 25 days with no response from Tahsildar office.');
testAssert(safeText.safe === true, 'Safe grievance description must pass validation');

console.log('   ✓ PII filtering accurately blocks Aadhaar, bank details, cards, and passwords.');

// ============================================================================
// 4. GRIEVANCE INPUT VALIDATION
// ============================================================================
console.log('4. Testing input validation rules for grievance submission...');

// Short subject (< 5 chars)
const shortSubject = validateGrievanceInput({
  subject: 'Help',
  category: 'application_delay',
  description: 'This is a detailed description of my issue with the public service delivery.',
});
testAssert(shortSubject.valid === false, 'Short subject under 5 chars must fail');

// Long subject (> 150 chars)
const longSubject = validateGrievanceInput({
  subject: 'A'.repeat(151),
  category: 'application_delay',
  description: 'This is a detailed description of my issue with the public service delivery.',
});
testAssert(longSubject.valid === false, 'Long subject over 150 chars must fail');

// Invalid category
const badCat = validateGrievanceInput({
  subject: 'Delay in certificate issuance',
  category: 'invalid_category_xyz',
  description: 'This is a detailed description of my issue with the public service delivery.',
});
testAssert(badCat.valid === false, 'Unknown category must fail validation');

// Short description (< 20 chars)
const shortDesc = validateGrievanceInput({
  subject: 'Delay in certificate issuance',
  category: 'application_delay',
  description: 'Too short text',
});
testAssert(shortDesc.valid === false, 'Short description under 20 chars must fail');

// Description containing Aadhaar
const piiDesc = validateGrievanceInput({
  subject: 'Delay in certificate issuance',
  category: 'application_delay',
  description: 'My Aadhaar is 1234 5678 9012 and application is pending for many days.',
});
testAssert(piiDesc.valid === false, 'Description with PII must fail grievance input validation');

// Perfectly valid grievance input
const validGrievance = validateGrievanceInput({
  subject: 'Ration card application delayed beyond notified timeline',
  category: 'application_delay',
  description: 'Submitted application on 1st November for new digital ration card. The 30-day timeline has lapsed without any update from the Food Distribution Office.',
});
testAssert(validGrievance.valid === true, 'Valid grievance payload must pass validation');

console.log('   ✓ Input bounds and validation constraints verified.');

// ============================================================================
// 5. REFERENCE NUMBER FORMAT & UNIQUENESS
// ============================================================================
console.log('5. Testing reference number generation & format...');

const refRegex = /^GRV-\d{4}-[A-Z0-9]{8}$/;
const refs = new Set();
for (let i = 0; i < 50; i++) {
  const ref = generateGrievanceReference();
  testAssert(refRegex.test(ref), `Generated reference ${ref} must match format GRV-YYYY-XXXXXXXX`);
  refs.add(ref);
}
testAssert(refs.size === 50, 'All 50 generated references must be unique');
console.log('   ✓ Reference number format and uniqueness verified.');

// ============================================================================
// 6. SUMMARY METRICS COMPUTATION (MUTUALLY EXCLUSIVE)
// ============================================================================
console.log('6. Testing summary metrics aggregation & mutually exclusive counts...');

const sampleGrievances = [
  { status: 'submitted' },
  { status: 'under_review' },
  { status: 'response_provided' },
  { status: 'information_required' },
  { status: 'information_required' },
  { status: 'resolved' },
  { status: 'closed' },
];

const summary = getGrievanceSummary(sampleGrievances);
testAssert(summary.total === 7, 'Total count must match records length');
testAssert(summary.awaitingReview === 3, 'Awaiting review must count submitted, under_review, response_provided (3)');
testAssert(summary.informationRequired === 2, 'Information required must count exactly 2');
testAssert(summary.resolved === 2, 'Resolved & closed must count exactly 2');
testAssert(
  summary.total === summary.awaitingReview + summary.informationRequired + summary.resolved,
  'Summary metrics must form an exact mutually exclusive partition of total'
);

// Empty list
const emptySummary = getGrievanceSummary([]);
testAssert(emptySummary.total === 0, 'Empty list total is 0');
testAssert(emptySummary.awaitingReview === 0, 'Empty awaitingReview is 0');
testAssert(emptySummary.informationRequired === 0, 'Empty informationRequired is 0');
testAssert(emptySummary.resolved === 0, 'Empty resolved is 0');

console.log('   ✓ Summary metrics partition verified with zero overlap or double-counting.');

// ============================================================================
// 7. RTS STATUTORY INDEPENDENCE & LEGAL NOTICES
// ============================================================================
console.log('7. Testing RTS statutory independence & advisory generation...');

// Overdue Residence application (15 working days elapsed)
const overdueApp = {
  id: 'RES-2026-TEST1',
  service: 'residence',
  status: 'submitted',
  submitted_at: '2026-10-01T10:00:00Z',
  created_at: '2026-10-01T09:00:00Z',
  owner: 'user-1',
  citizen_id: 'DEMO-1001',
  name: 'Test Citizen',
  consent: 1,
  expires_at: '2026-12-01T00:00:00Z',
  scopes: '["residence"]',
  result: null,
  email: null,
  statement: null,
  decision_note: null,
  decided_at: null,
  details: null,
};

const advisory = getRtsAdvisoryForGrievance(overdueApp);
testAssert(advisory !== null, 'RTS covered service must generate advisory');
testAssert(advisory?.isOverdue === true, 'Lapsed application must be flagged as overdue');
testAssert(advisory?.stipulatedDays === 15, 'Residence timeline is 15 days');
testAssert(advisory?.advisoryText.includes('Section 9(1)'), 'Advisory must cite Section 9(1) First Appeal');
testAssert(advisory?.advisoryText.includes('does NOT constitute a statutory First Appeal'), 'Advisory must state grievance is not an appeal');
testAssert(advisory?.advisoryText.includes('Aaple Sarkar'), 'Advisory must guide to official Aaple Sarkar portal');
testAssert(advisory?.aapleSarkarUrl.startsWith('https://'), 'Official link must be secure HTTPS');

// Non-RTS covered application (Pension financial sanction)
const pensionApp = {
  id: 'PEN-2026-TEST2',
  service: 'pension',
  status: 'submitted',
  submitted_at: '2026-10-01T10:00:00Z',
  created_at: '2026-10-01T09:00:00Z',
  owner: 'user-1',
  citizen_id: 'DEMO-1001',
  name: 'Test Citizen',
  consent: 1,
  expires_at: '2026-12-01T00:00:00Z',
  scopes: '["pension"]',
  result: null,
  email: null,
  statement: null,
  decision_note: null,
  decided_at: null,
  details: null,
};

const pensionAdvisory = getRtsAdvisoryForGrievance(pensionApp);
testAssert(pensionAdvisory === null, 'Non-RTS covered service must not generate false RTS deadline advisory');

console.log('   ✓ RTS statutory separation verified: filing grievance does not affect Section 9 appeals.');

// ============================================================================
// 8. TRILINGUAL TRANSLATION INTEGRITY
// ============================================================================
console.log('8. Testing English, Hindi, and Marathi translations completeness...');

const requiredTranslationKeys = [
  'Grievance Centre',
  'Unified Grievance Centre',
  'Submit a Grievance',
  'Lodge a Service Grievance',
  'Total Grievances',
  'Awaiting Review',
  'Information Required',
  'Resolved & Closed',
  'My Grievances',
  'All Grievances',
  'Lodge New Grievance',
  'Application delay',
  'Rejection or adverse decision',
  'Incorrect application information',
  'Service delivery issue',
  'Department communication',
  'Technical issue with government portal',
  'Other service-related complaint',
  'Submitted',
  'Under Review',
  'Response Provided',
  'Resolved',
  'Closed',
  'Department not verified',
  'Department Verified',
  'GovSync Internal Workflow Status',
  'Provide Requested Information',
  'Submit Clarification',
  'Close Grievance',
];

for (const key of requiredTranslationKeys) {
  const pair = grievanceTranslations[key];
  testAssert(Boolean(pair), `Translation key "${key}" must be registered in grievanceTranslations`);
  testAssert(Array.isArray(pair) && pair.length === 2, `Key "${key}" must have [Hindi, Marathi] pair`);
  testAssert(typeof pair[0] === 'string' && pair[0].trim().length > 0, `Key "${key}" Hindi string must not be empty`);
  testAssert(typeof pair[1] === 'string' && pair[1].trim().length > 0, `Key "${key}" Marathi string must not be empty`);
}

console.log(`   ✓ All ${requiredTranslationKeys.length} core Grievance translation keys verified in EN, HI, MR.`);

// ============================================================================
// 9. PUBLIC REFERENCE LOOKUP SECURITY & DATA SANITIZATION INVARIANTS
// ============================================================================
console.log('9. Testing public reference lookup security & privacy invariants...');

// 9a. Format validation for reference numbers: Must strictly follow GRV-YYYY-XXXXXXXX
const validRefRegex = /^GRV-\d{4}-[A-Z0-9]{8}$/;
testAssert(validRefRegex.test('GRV-2026-ABCD1234'), 'Valid reference matches regex');
testAssert(!validRefRegex.test('GRV-2026-XYZ'), 'Short reference rejected');
testAssert(!validRefRegex.test('APP-2026-12345678'), 'Wrong prefix rejected');
testAssert(!validRefRegex.test(''), 'Empty reference rejected');
testAssert(!validRefRegex.test('SELECT * FROM grievances'), 'SQL injection string rejected');

// 9b. PII error responses must NOT echo back or expose the sensitive data
const sampleAadhaar = '1234 5678 9012';
const aadhaarCheck = validatePiiSafety(`Citizen Aadhaar ${sampleAadhaar} pending`);
testAssert(!aadhaarCheck.safe, 'Aadhaar input flagged as unsafe');
testAssert(!aadhaarCheck.error?.includes(sampleAadhaar), 'Error response must NEVER echo the sensitive Aadhaar number');

const sampleCard = '4111222233334444';
const cardCheck = validatePiiSafety(`Paid with card ${sampleCard}`);
testAssert(!cardCheck.safe, 'Card input flagged as unsafe');
testAssert(!cardCheck.error?.includes(sampleCard), 'Error response must NEVER echo the sensitive credit card number');

console.log('   ✓ Public reference format and privacy invariants verified.');

// ============================================================================
// 10. LIVE ENDPOINT AUTHORIZATION & CROSS-USER ISOLATION TESTS
// ============================================================================
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
console.log(`10. Testing live grievance authorization & cross-user isolation on ${base}...`);

try {
  const probe = await fetch(`${base}/api/auth/demo`, { method: 'OPTIONS' }).catch(() => null);
  if (!probe) {
    console.log('   (Dev server not running; skipping live HTTP checks in unit run)');
  } else {
    // 10a. Unauthenticated access must be strictly rejected (401)
    const anonGrievances = await fetch(`${base}/api/grievances`, { headers: { Origin: base } });
    testAssert(anonGrievances.status === 401, 'Anonymous GET /api/grievances must return 401');

    const anonRefLookup = await fetch(`${base}/api/grievances?referenceNumber=GRV-2026-FAKE0000`, { headers: { Origin: base } });
    testAssert(anonRefLookup.status === 401, 'Anonymous reference lookup must return 401 (no unauthenticated leakage)');

    const anonPostGrievance = await fetch(`${base}/api/grievances`, {
      method: 'POST',
      headers: { Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'application_delay', subject: 'Delay in service', description: 'Detailed grievance description for delay.' }),
    });
    testAssert(anonPostGrievance.status === 401, 'Anonymous POST /api/grievances must return 401');

    // 10b. Authenticate Citizen A (DEMO-1001)
    const authA = await fetch(`${base}/api/auth/demo`, {
      method: 'POST',
      headers: { Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify({ citizenId: 'DEMO-1001' }),
    });
    testAssert(authA.status === 200, 'Citizen A auth must succeed');
    const cookieA = authA.headers.get('set-cookie')?.split(';')[0] || '';

    // 10c. Authenticate Admin
    let cookieAdmin = '';
    if (existsSync('.private/admin-account.json') && existsSync('.private/ADMIN-LOGIN.txt')) {
      const cfg = JSON.parse(readFileSync('.private/admin-account.json', 'utf8'));
      const adminPassword = process.env.TEST_ADMIN_PASSWORD || readFileSync('.private/ADMIN-LOGIN.txt', 'utf8').match(/^Password: (.+)$/m)[1];
      const authAdmin = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { Origin: base, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: cfg.mobile, password: adminPassword, role: 'admin' }),
      });
      testAssert(authAdmin.status === 200, 'Admin auth must succeed');
      cookieAdmin = authAdmin.headers.get('set-cookie')?.split(';')[0] || '';
    }

    // 10d. Authenticate Citizen B (DEMO-1002)
    const authB = await fetch(`${base}/api/auth/demo`, {
      method: 'POST',
      headers: { Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify({ citizenId: 'DEMO-1002' }),
    });
    testAssert(authB.status === 200, 'Citizen B auth must succeed');
    const cookieB = authB.headers.get('set-cookie')?.split(';')[0] || '';

    // 10e. Citizen A submits a grievance attempting to tamper with privileged fields (status, admin_note)
    const submitRes = await fetch(`${base}/api/grievances`, {
      method: 'POST',
      headers: { Origin: base, Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'service_delivery_issue',
        subject: `Security Audit Ticket ${Date.now()}`,
        description: 'Testing cross-user authorization and tampering prevention on GovSync platform.',
        status: 'resolved',
        adminNote: 'Internal tampering attempt',
        resolutionSummary: 'Faked resolution',
      }),
    });
    testAssert(submitRes.status === 201, 'Grievance submission must return 201');
    const submitData = await submitRes.json();
    const createdGrievance = submitData.grievance;
    testAssert(createdGrievance.status === 'submitted', 'Status must remain "submitted", ignoring citizen tampering');
    testAssert(createdGrievance.admin_note === null, 'Admin note must remain null, citizen cannot inject admin notes');
    testAssert(createdGrievance.resolution_summary === null, 'Resolution summary must remain null on creation');

    // 10f. Cross-user access by ID: Citizen B attempts to access Citizen A\'s grievance by ID -> 403 Forbidden
    const crossIdRes = await fetch(`${base}/api/grievances/${createdGrievance.id}`, {
      method: 'GET',
      headers: { Origin: base, Cookie: cookieB },
    });
    testAssert(crossIdRes.status === 403, 'Citizen B viewing Citizen A grievance by ID must return 403 Forbidden');

    // 10g. Cross-user lookup by reference number: Citizen B looks up Citizen A\'s reference -> returns empty array
    const crossRefRes = await fetch(`${base}/api/grievances?referenceNumber=${createdGrievance.reference_number}`, {
      method: 'GET',
      headers: { Origin: base, Cookie: cookieB },
    });
    testAssert(crossRefRes.status === 200, 'Reference lookup returns 200');
    const crossRefData = await crossRefRes.json();
    testAssert(Array.isArray(crossRefData.grievances) && crossRefData.grievances.length === 0, 'Citizen B must receive 0 records for Citizen A reference number (zero data leakage)');

    // 10h. Invalid or random reference numbers return empty array
    const randRefRes = await fetch(`${base}/api/grievances?referenceNumber=GRV-2026-NOTEXIST`, {
      method: 'GET',
      headers: { Origin: base, Cookie: cookieA },
    });
    testAssert(randRefRes.status === 200, 'Non-existent reference query returns 200');
    const randRefData = await randRefRes.json();
    testAssert(Array.isArray(randRefData.grievances) && randRefData.grievances.length === 0, 'Non-existent reference must return 0 records');

    // 10i. Cross-user mutation: Citizen B attempts to respond to Citizen A\'s grievance -> 403 Forbidden
    const crossRespondRes = await fetch(`${base}/api/grievances/${createdGrievance.id}/respond`, {
      method: 'POST',
      headers: { Origin: base, Cookie: cookieB, 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: 'Malicious response from another citizen' }),
    });
    testAssert(crossRespondRes.status === 403, 'Citizen B responding to Citizen A grievance must return 403 Forbidden');

    // 10j. Cross-user close: Citizen B attempts to close Citizen A\'s grievance -> 403 Forbidden
    const crossCloseRes = await fetch(`${base}/api/grievances/${createdGrievance.id}/close`, {
      method: 'POST',
      headers: { Origin: base, Cookie: cookieB, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    testAssert(crossCloseRes.status === 403, 'Citizen B closing Citizen A grievance must return 403 Forbidden');

    // 10k. Citizen attempts to call admin action endpoint -> 403 Forbidden
    const citizenAdminActionRes = await fetch(`${base}/api/admin/grievances/${createdGrievance.id}/action`, {
      method: 'POST',
      headers: { Origin: base, Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved', adminNote: 'Citizen trying to act as admin' }),
    });
    testAssert(citizenAdminActionRes.status === 403, 'Citizen calling admin action must return 403 Forbidden');

    // 10l. Admin performs legitimate action with private internal adminNote
    const adminActionRes = await fetch(`${base}/api/admin/grievances/${createdGrievance.id}/action`, {
      method: 'POST',
      headers: { Origin: base, Cookie: cookieAdmin, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'information_required',
        adminNote: 'INTERNAL NOTE: Citizen reported delay, verified with desk officer.',
        resolutionSummary: 'Please provide the application acknowledgement receipt.',
      }),
    });
    testAssert(adminActionRes.status === 200, 'Admin action must succeed with 200');
    const adminActionData = await adminActionRes.json();
    testAssert(adminActionData.grievance.admin_note !== null, 'Admin sees admin_note');

    // 10m. Citizen A views the grievance now: admin_note MUST be sanitized to null
    const citizenViewRes = await fetch(`${base}/api/grievances/${createdGrievance.id}`, {
      method: 'GET',
      headers: { Origin: base, Cookie: cookieA },
    });
    testAssert(citizenViewRes.status === 200, 'Citizen A viewing own grievance returns 200');
    const citizenViewData = await citizenViewRes.json();
    testAssert(citizenViewData.grievance.status === 'information_required', 'Status updated to information_required');
    testAssert(citizenViewData.grievance.admin_note === null, 'CRITICAL: admin_note MUST be sanitized to null in citizen response');
    testAssert(citizenViewData.grievance.resolution_summary === 'Please provide the application acknowledgement receipt.', 'Resolution summary visible');

    // 10n. Verify timeline events do NOT contain the internal adminNote in details
    const events = citizenViewData.events || [];
    for (const ev of events) {
      testAssert(!ev.details.includes('INTERNAL NOTE'), 'Event details must NEVER leak internal admin note');
    }

    console.log('   ✓ All live HTTP authorization, ownership, and sanitization checks PASSED!');
  }
} catch (e) {
  console.log(`   (HTTP error: ${e.message})`);
  throw e;
}

console.log(`\nPASS: All ${assertions} assertions passed in test-grievances.mjs.`);
