import assert from 'node:assert/strict';
import { testAccounts } from './test-accounts.mjs';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) {
  throw new Error('Run this test against a local preview only.');
}

console.log('--- GOVSYNC INTEROPERABILITY & PRIVACY TEST SUITE (PHASE 3 DAY 10) ---');

// Setup Accounts
const { cookie: citizenACookie, adminCookie } = await testAccounts(base);

async function getDemoCookie(citizenId) {
  const r = await fetch(base + '/api/auth/demo', {
    method: 'POST',
    headers: { Origin: base, 'Content-Type': 'application/json' },
    body: JSON.stringify({ citizenId })
  });
  if (!r.ok) throw new Error('Demo login failed: ' + await r.text());
  return r.headers.getSetCookie().map(x => x.split(';')[0]).join('; ');
}

const citizenBCookie = await getDemoCookie('DEMO-1002');
assert.ok(citizenACookie, 'Citizen A session cookie created');
assert.ok(citizenBCookie, 'Citizen B session cookie created');
assert.ok(adminCookie, 'Admin session cookie created');

let passed = 0;

async function request(method, path, data, headers = {}) {
  const isPost = method === 'POST' || method === 'PUT' || method === 'PATCH';
  const res = await fetch(`${base}/api/${path}`, {
    method,
    headers: {
      Origin: base,
      ...(isPost ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    },
    body: data !== undefined ? (typeof data === 'string' ? data : JSON.stringify(data)) : undefined
  });
  let body = null;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, headers: res.headers, body };
}

// -----------------------------------------------------------------------------
// 1. API STANDARDIZATION & DISCOVERY
// -----------------------------------------------------------------------------
console.log('Testing 1: API Standardization & GET /api/version...');
{
  const v = await request('GET', 'version');
  assert.equal(v.status, 200, 'GET /api/version returns 200');
  assert.equal(v.headers.get('api-version'), '1.0', 'API-Version header is 1.0');
  assert.equal(v.headers.get('x-content-type-options'), 'nosniff', 'X-Content-Type-Options is nosniff');
  assert.equal(v.headers.get('x-frame-options'), 'DENY', 'X-Frame-Options is DENY');
  assert.equal(v.headers.get('cache-control'), 'no-store', 'Cache-Control is no-store');
  assert.ok(v.headers.get('x-request-id'), 'X-Request-Id header is present');

  assert.equal(v.body.name, 'GovSync Interoperability API');
  assert.equal(v.body.version, '1.0.0');
  assert.equal(v.body.status, 'operational');
  assert.ok(v.body.timestamp, 'Timestamp present');
  assert.equal(v.body.services.count, 7, '7 supported services');
  assert.equal(v.body.departments.count, 5, '5 supported departments');
  assert.ok(Array.isArray(v.body.standards.supportedMethods), 'Supported methods listed');

  const vText = JSON.stringify(v.body);
  assert.ok(!vText.includes('password'), 'Version endpoint exposes no password data');
  assert.ok(!vText.includes('secret'), 'Version endpoint exposes no secret data');
  assert.ok(!vText.includes('token'), 'Version endpoint exposes no token data');
  passed += 9;
}

// -----------------------------------------------------------------------------
// 2. REQUEST ID TRACING & PROPAGATION
// -----------------------------------------------------------------------------
console.log('Testing 2: Request ID Tracing & Propagation...');
{
  const customId = 'req-trace-' + Date.now();
  const v = await request('GET', 'version', undefined, { 'X-Request-Id': customId });
  assert.equal(v.headers.get('x-request-id'), customId, 'Custom X-Request-Id is propagated');
  assert.equal(v.body.requestId, customId, 'requestId present in JSON body');

  const err = await request('GET', 'non-existent-endpoint-xyz', undefined, { 'X-Request-Id': customId, Cookie: citizenACookie });
  assert.equal(err.status, 404);
  assert.equal(err.headers.get('x-request-id'), customId, 'X-Request-Id preserved in 404 response');
  assert.equal(err.body.requestId, customId, 'requestId included in error body');

  const unauthErr = await request('GET', 'non-existent-endpoint-xyz', undefined, { 'X-Request-Id': customId });
  assert.equal(unauthErr.status, 401, 'Unauthenticated unknown path blocked with 401');
  assert.equal(unauthErr.headers.get('x-request-id'), customId, 'X-Request-Id preserved in 401 response');
  assert.equal(unauthErr.body.requestId, customId, 'requestId included in 401 error body');
  passed += 6;
}

// -----------------------------------------------------------------------------
// 3. UNSUPPORTED HTTP METHODS & RFC 7231 / 9110 COMPLIANCE
// -----------------------------------------------------------------------------
console.log('Testing 3: Unsupported HTTP Methods & OPTIONS handling...');
{
  const putRes = await request('PUT', 'version');
  assert.equal(putRes.status, 405, 'PUT returns 405 Method Not Allowed');
  assert.equal(putRes.headers.get('allow'), 'GET, POST, OPTIONS, HEAD', 'Allow header on 405');
  assert.equal(putRes.body.code, 'METHOD_NOT_ALLOWED');
  assert.equal(putRes.body.error, 'Method not allowed.');
  assert.ok(putRes.body.requestId, 'requestId in 405 body');

  const patchRes = await request('PATCH', 'version');
  assert.equal(patchRes.status, 405, 'PATCH returns 405');
  assert.equal(patchRes.headers.get('allow'), 'GET, POST, OPTIONS, HEAD');

  const delRes = await request('DELETE', 'version');
  assert.equal(delRes.status, 405, 'DELETE returns 405');

  const optRes = await request('OPTIONS', 'version');
  assert.equal(optRes.status, 204, 'OPTIONS returns 204 No Content');
  assert.equal(optRes.headers.get('allow'), 'GET, POST, OPTIONS, HEAD', 'Allow header on OPTIONS');
  assert.equal(optRes.headers.get('api-version'), '1.0');

  // Verify unsupported methods cannot mutate existing data
  const delAppRes = await request('DELETE', 'applications/SS-2026-FAKE', undefined, { Cookie: citizenACookie });
  assert.equal(delAppRes.status, 405, 'DELETE /api/applications/:id returns 405');
  assert.equal(delAppRes.headers.get('allow'), 'GET, POST, OPTIONS, HEAD');

  const patchAppRes = await request('PATCH', 'applications/SS-2026-FAKE', { status: 'approved' }, { Cookie: citizenACookie });
  assert.equal(patchAppRes.status, 405, 'PATCH /api/applications/:id returns 405');
  passed += 10;
}

// -----------------------------------------------------------------------------
// 4. REQUEST VALIDATION & PAYLOAD SIZE LIMITS
// -----------------------------------------------------------------------------
console.log('Testing 4: Request Validation & Payload Limits...');
{
  // Malformed JSON
  const malformed = await fetch(`${base}/api/applications`, {
    method: 'POST',
    headers: { Origin: base, Cookie: citizenACookie, 'Content-Type': 'application/json' },
    body: '{"invalid_json: true'
  });
  assert.equal(malformed.status, 400, 'Malformed JSON returns 400');
  const malformedJson = await malformed.json();
  assert.ok(malformedJson.error.includes('valid JSON request body is required'));

  // Oversized payload (> 12KB)
  const hugeData = { data: 'x'.repeat(13000) };
  const hugeRes = await fetch(`${base}/api/applications`, {
    method: 'POST',
    headers: { Origin: base, Cookie: citizenACookie, 'Content-Type': 'application/json' },
    body: JSON.stringify(hugeData)
  });
  assert.equal(hugeRes.status, 400, 'Oversized payload returns 400');
  passed += 3;
}

// -----------------------------------------------------------------------------
// 5. IDENTITY & AUTHENTICATION ARCHITECTURE
// -----------------------------------------------------------------------------
console.log('Testing 5: Identity, Session & CSRF Security...');
{
  // Unauthenticated access
  const unauth = await request('GET', 'workspace');
  assert.equal(unauth.status, 401, 'Unauthenticated /api/workspace rejected with 401');

  // Forged session cookie
  const forged = await request('GET', 'workspace', undefined, {
    Cookie: 'govsync_session=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  });
  assert.equal(forged.status, 401, 'Forged session token rejected with 401');

  // Cross-site Origin / CSRF attack attempt
  const csrf = await fetch(`${base}/api/applications`, {
    method: 'POST',
    headers: { Origin: 'https://evil-attacker.example', Cookie: citizenACookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ citizenId: 'DEMO-1001', scopes: ['identity'], accepted: true })
  });
  assert.equal(csrf.status, 403, 'Cross-site origin rejected with 403 CSRF defense');
  passed += 3;
}

// -----------------------------------------------------------------------------
// 6. AUTHORIZATION, RBAC & CROSS-CITIZEN ISOLATION
// -----------------------------------------------------------------------------
console.log('Testing 6: Authorization & Cross-Citizen Isolation...');
{
  // Citizen attempting admin action
  const adminForbidden = await request('GET', 'admin/mappings/fake-id', undefined, { Cookie: citizenACookie });
  assert.equal(adminForbidden.status, 403, 'Citizen blocked from admin mappings with 403');

  const adminDecisionForbidden = await request('POST', 'applications/fake-id/decision', { decision: 'approved' }, { Cookie: citizenACookie });
  assert.equal(adminDecisionForbidden.status, 403, 'Citizen blocked from admin decision with 403');

  // Citizen A creates Application A
  const scopes = ['identity', 'education', 'income', 'residence'];
  const appRes = await request('POST', 'applications', {
    citizenId: 'DEMO-1001',
    service: 'scholarship',
    scopes,
    accepted: true
  }, { Cookie: citizenACookie });
  assert.equal(appRes.status, 201, 'Citizen A creates application');
  const appA = appRes.body.application;
  assert.ok(appA.id, 'Application ID returned');

  // Citizen A can access App A
  const aOwnerRes = await request('GET', `applications/${appA.id}`, undefined, { Cookie: citizenACookie });
  assert.equal(aOwnerRes.status, 200, 'Citizen A can access own application');

  // Citizen B CANNOT access App A (isolation)
  const bAccessRes = await request('GET', `applications/${appA.id}`, undefined, { Cookie: citizenBCookie });
  assert.equal(bAccessRes.status, 404, 'Citizen B cannot view Citizen A application (returns 404)');

  // Citizen B CANNOT evaluate App A
  const bEvalRes = await request('POST', `applications/${appA.id}/evaluate`, {}, { Cookie: citizenBCookie });
  assert.equal(bEvalRes.status, 404, 'Citizen B cannot evaluate Citizen A application');

  // Citizen B CANNOT revoke App A
  const bRevokeRes = await request('POST', `applications/${appA.id}/revoke`, {}, { Cookie: citizenBCookie });
  assert.equal(bRevokeRes.status, 404, 'Citizen B cannot revoke Citizen A application');

  // Admin CAN view App A
  const adminViewRes = await request('GET', `applications/${appA.id}`, undefined, { Cookie: adminCookie });
  assert.equal(adminViewRes.status, 200, 'Admin can view application for oversight');
  passed += 7;
}

// -----------------------------------------------------------------------------
// 7. CONSENT & PRIVACY INFRASTRUCTURE
// -----------------------------------------------------------------------------
console.log('Testing 7: Consent & Privacy Infrastructure...');
{
  const scopes = ['identity', 'education', 'income', 'residence'];
  const createRes = await request('POST', 'applications', {
    citizenId: 'DEMO-1001',
    service: 'scholarship',
    scopes,
    accepted: true
  }, { Cookie: citizenACookie });
  assert.equal(createRes.status, 201);
  const app = createRes.body.application;

  // Dedicated Consent Inspection Endpoint
  const consentInspect = await request('GET', `applications/${app.id}/consent`, undefined, { Cookie: citizenACookie });
  assert.equal(consentInspect.status, 200, 'GET /api/applications/:id/consent returns 200');
  assert.equal(consentInspect.body.applicationId, app.id);
  assert.equal(consentInspect.body.consentGranted, true);
  assert.equal(consentInspect.body.status, 'active');
  assert.deepEqual(consentInspect.body.scopes, scopes);
  assert.equal(consentInspect.body.revocable, true);
  assert.ok(consentInspect.body.purpose, 'Purpose statement provided');

  // Cross-citizen consent inspection is blocked
  const bConsentInspect = await request('GET', `applications/${app.id}/consent`, undefined, { Cookie: citizenBCookie });
  assert.equal(bConsentInspect.status, 404, 'Citizen B cannot inspect Citizen A consent');

  // Consent Revocation
  const revokeRes = await request('POST', `applications/${app.id}/revoke`, {}, { Cookie: citizenACookie });
  assert.equal(revokeRes.status, 200, 'Revoke endpoint returns 200');
  assert.equal(revokeRes.body.revoked, true);
  assert.equal(revokeRes.body.status, 'revoked');

  // Inspect consent after revocation
  const consentAfterRevoke = await request('GET', `applications/${app.id}/consent`, undefined, { Cookie: citizenACookie });
  assert.equal(consentAfterRevoke.status, 200);
  assert.equal(consentAfterRevoke.body.consentGranted, false);
  assert.equal(consentAfterRevoke.body.status, 'revoked');

  // Verification attempts blocked after revocation
  const deptCheck = await request('GET', `departments/identity/DEMO-1001?applicationId=${app.id}`, undefined, { Cookie: citizenACookie });
  assert.equal(deptCheck.status, 403, 'Department verification blocked after consent revocation');
  assert.ok(deptCheck.body.error.includes('Consent is revoked or expired'));

  // Evaluation attempt blocked after revocation
  const evalCheck = await request('POST', `applications/${app.id}/evaluate`, {}, { Cookie: citizenACookie });
  assert.equal(evalCheck.status, 403, 'Application evaluation blocked after consent revocation');

  // Submission attempt blocked after revocation
  const subCheck = await request('POST', `applications/${app.id}/submit`, { confirmed: true }, { Cookie: citizenACookie });
  assert.equal(subCheck.status, 403, 'Application submission blocked after consent revocation');

  // Data reuse paths blocked after revocation
  const reuseResCheck = await request('POST', `applications/${app.id}/reuse-residence`, { sourceId: 'fake-id' }, { Cookie: citizenACookie });
  assert.equal(reuseResCheck.status, 403, 'reuse-residence blocked when consent is revoked');

  const reuseDataCheck = await request('POST', `applications/${app.id}/reuse-data`, { sourceId: 'fake-id', department: 'residence' }, { Cookie: citizenACookie });
  assert.equal(reuseDataCheck.status, 403, 'reuse-data blocked when consent is revoked');

  // Verification that client-supplied payload cannot silently restore revoked consent
  const tamperEval = await request('POST', `applications/${app.id}/evaluate`, { consent: 1, accepted: true }, { Cookie: citizenACookie });
  assert.equal(tamperEval.status, 403, 'Client payload cannot bypass revoked consent in evaluate');

  const tamperSubmit = await request('POST', `applications/${app.id}/submit`, { consent: 1, accepted: true, confirmed: true }, { Cookie: citizenACookie });
  assert.equal(tamperSubmit.status, 403, 'Client payload cannot bypass revoked consent in submit');

  const verifyStillRevoked = await request('GET', `applications/${app.id}/consent`, undefined, { Cookie: citizenACookie });
  assert.equal(verifyStillRevoked.body.consentGranted, false, 'consentGranted remains false after tamper attempt');
  assert.equal(verifyStillRevoked.body.status, 'revoked', 'status remains revoked after tamper attempt');

  // Verify Audit Log records consent lifecycle
  const ws = await request('GET', 'workspace', undefined, { Cookie: citizenACookie });
  assert.ok(ws.body.audit.some(e => e.action === 'Consent granted'), 'Audit has Consent granted event');
  assert.ok(ws.body.audit.some(e => e.action === 'Consent revoked'), 'Audit has Consent revoked event');
  assert.ok(ws.body.audit.some(e => e.action === 'Consent check' && e.outcome === 'blocked'), 'Audit has Consent check blocked event');
  passed += 19;
}

// -----------------------------------------------------------------------------
// 8. DATA MINIMIZATION ON PUBLIC ENDPOINTS
// -----------------------------------------------------------------------------
console.log('Testing 8: Data Minimization on Public Endpoints...');
{
  const dir = await request('GET', 'directory');
  assert.equal(dir.status, 200, 'Directory endpoint public (200)');
  assert.ok(dir.body.offices.length > 0, 'Offices present');
  const dirText = JSON.stringify(dir.body);
  assert.ok(!dirText.includes('DEMO-1001'), 'Directory contains 0 citizen IDs');
  assert.ok(!dirText.includes('asha@'), 'Directory contains 0 citizen emails');

  const agri = await request('GET', 'agriculture');
  assert.equal(agri.status, 200, 'Agriculture endpoint public (200)');
  assert.ok(agri.body.items.length > 0, 'Agriculture items present');
  const agriText = JSON.stringify(agri.body);
  assert.ok(!agriText.includes('DEMO-1001'), 'Agriculture contains 0 citizen IDs');

  const trans = await request('GET', 'transparency');
  assert.equal(trans.status, 200, 'Transparency endpoint public (200)');
  assert.ok(trans.body.announcements.length > 0, 'Announcements present');
  const transText = JSON.stringify(trans.body);
  assert.ok(!transText.includes('DEMO-1001'), 'Transparency contains 0 citizen IDs');

  // Transparency Notifications strictly requires authentication
  const notifUnauth = await request('GET', 'transparency/notifications');
  assert.equal(notifUnauth.status, 401, 'Notifications requires authentication');

  const notifAuth = await request('GET', 'transparency/notifications', undefined, { Cookie: citizenACookie });
  assert.equal(notifAuth.status, 200, 'Authenticated notifications returns 200');
  assert.ok(Array.isArray(notifAuth.body.notifications), 'Notifications array returned');
  passed += 9;
}

// -----------------------------------------------------------------------------
// 9. STATE MACHINE TRANSITIONS & DATA INTEGRITY
// -----------------------------------------------------------------------------
console.log('Testing 9: State Machine Transitions & Integrity Guards...');
{
  const scopes = ['identity', 'education', 'income', 'residence'];
  const app = (await request('POST', 'applications', {
    citizenId: 'DEMO-1001',
    service: 'scholarship',
    scopes,
    accepted: true
  }, { Cookie: citizenACookie })).body.application;

  // Cannot submit draft application
  const prematureSubmit = await request('POST', `applications/${app.id}/submit`, { confirmed: true }, { Cookie: citizenACookie });
  assert.equal(prematureSubmit.status, 409, 'Submitting draft application returns 409 Conflict');

  // Cannot evaluate before completing checks
  const prematureEval = await request('POST', `applications/${app.id}/evaluate`, {}, { Cookie: citizenACookie });
  assert.equal(prematureEval.status, 409, 'Evaluating before department checks returns 409');

  // Complete checks
  for (const d of scopes) {
    const chk = await request('GET', `departments/${d}/DEMO-1001?applicationId=${app.id}`, undefined, { Cookie: citizenACookie });
    assert.equal(chk.status, 200);
  }

  // Evaluate
  const evalRes = await request('POST', `applications/${app.id}/evaluate`, {}, { Cookie: citizenACookie });
  assert.equal(evalRes.status, 200);
  assert.equal(evalRes.body.result.status, 'eligible');

  // Submit without confirmation
  const unconfirmed = await request('POST', `applications/${app.id}/submit`, {
    email: 'asha@example.test',
    statement: 'A valid statement of sufficient length for evaluation.',
    confirmed: false
  }, { Cookie: citizenACookie });
  assert.equal(unconfirmed.status, 400, 'Unconfirmed submission rejected with 400');

  // Submit with invalid email
  const badEmail = await request('POST', `applications/${app.id}/submit`, {
    email: 'not-an-email',
    statement: 'A valid statement of sufficient length for evaluation.',
    confirmed: true
  }, { Cookie: citizenACookie });
  assert.equal(badEmail.status, 400, 'Bad email rejected with 400');

  // Valid submission
  const validSubmit = await request('POST', `applications/${app.id}/submit`, {
    email: 'asha@example.test',
    statement: 'A valid statement of sufficient length for evaluation.',
    confirmed: true
  }, { Cookie: citizenACookie });
  assert.equal(validSubmit.status, 200, 'Submission succeeded');
  assert.equal(validSubmit.body.application.status, 'submitted');

  // Cannot re-evaluate submitted application
  const postSubmitEval = await request('POST', `applications/${app.id}/evaluate`, {}, { Cookie: citizenACookie });
  assert.equal(postSubmitEval.status, 409, 'Re-evaluating submitted application returns 409');

  // Cannot re-verify department on submitted application
  const postSubmitCheck = await request('GET', `departments/identity/DEMO-1001?applicationId=${app.id}`, undefined, { Cookie: citizenACookie });
  assert.equal(postSubmitCheck.status, 409, 'Department check on submitted application returns 409');

  // Idempotent re-submission returns 200
  const reSubmit = await request('POST', `applications/${app.id}/submit`, {
    email: 'asha@example.test',
    statement: 'A valid statement of sufficient length for evaluation.',
    confirmed: true
  }, { Cookie: citizenACookie });
  assert.equal(reSubmit.status, 200, 'Idempotent resubmission returns 200');
  assert.equal(reSubmit.body.application.submitted_at, validSubmit.body.application.submitted_at);
  passed += 11;
}

// -----------------------------------------------------------------------------
// 10. IMMUTABLE AUDIT TRAIL ARCHITECTURE
// -----------------------------------------------------------------------------
console.log('Testing 10: Immutable Audit Trail Architecture...');
{
  // Verification that audit cannot be altered or deleted via API
  const auditPut = await request('PUT', 'audit');
  assert.equal(auditPut.status, 405, 'PUT /api/audit returns 405');

  const auditDelete = await request('DELETE', 'audit');
  assert.equal(auditDelete.status, 405, 'DELETE /api/audit returns 405');

  const auditPatch = await request('PATCH', 'audit');
  assert.equal(auditPatch.status, 405, 'PATCH /api/audit returns 405');

  const auditPost = await request('POST', 'audit', { action: 'fake' }, { Cookie: citizenACookie });
  assert.equal(auditPost.status, 404, 'Direct POST /api/audit returns 404 (audit is internal append-only)');

  // Verify audit records structure in workspace
  const ws = await request('GET', 'workspace', undefined, { Cookie: citizenACookie });
  assert.ok(ws.body.audit.length > 0, 'Audit entries present');
  const sampleEvent = ws.body.audit[0];
  assert.ok(sampleEvent.id, 'Audit entry has id');
  assert.ok(sampleEvent.owner, 'Audit entry has owner');
  assert.ok(sampleEvent.action, 'Audit entry has action');
  assert.ok(sampleEvent.outcome, 'Audit entry has outcome');
  assert.ok(sampleEvent.created_at, 'Audit entry has created_at');

  // Verify timestamps are strict ISO-8601 UTC and actor is non-empty
  assert.match(sampleEvent.created_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, 'Audit timestamp is strict ISO-8601 UTC');
  assert.ok(sampleEvent.owner && sampleEvent.owner.length > 0, 'Audit record has non-empty authenticated actor ID');

  // Check data minimization in audit details (no cleartext passwords or bearer secrets)
  const allDetails = ws.body.audit.map(e => e.details).join(' ');
  assert.ok(!allDetails.includes('password_hash'), 'No password hashes leaked in audit details');
  assert.ok(!allDetails.includes('token_hash'), 'No token hashes leaked in audit details');
  passed += 10;
}

console.log(`\n======================================================`);
console.log(`PASS: All ${passed} interoperability and privacy test assertions succeeded!`);
console.log(`======================================================\n`);
