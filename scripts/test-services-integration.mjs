import {testAccounts} from './test-accounts.mjs';
import assert from 'node:assert/strict';
import {services} from '../lib/services.ts';
import {getAllDepartments} from '../lib/registry.ts';

const base = process.env.TEST_BASE_URL || 'http://localhost:5173';
const {cookie, adminCookie} = await testAccounts(base);

let count = 0;
async function call(path, data, status = 200, headers = undefined) {
  const defaultCookie = path.endsWith('/decision') ? adminCookie : cookie;
  const cookieToUse = headers && 'Cookie' in headers ? headers.Cookie : defaultCookie;
  const r = await fetch(base + '/api/' + path, {
    method: data === undefined ? 'GET' : 'POST',
    headers: {
      Origin: base,
      ...(cookieToUse ? { Cookie: cookieToUse } : {}),
      ...headers,
      ...(data === undefined ? {} : {'Content-Type': 'application/json'}),
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const text = await r.text();
  let j = {};
  try { j = JSON.parse(text); } catch { j = { text }; }
  assert.equal(r.status, status, path + ': ' + text);
  count++;
  return j;
}

let approvedResidenceAppId = '';

// 1. Verify all 7 services exist and can be initialized
for (const [svcId, def] of Object.entries(services)) {
  const citizenId = svcId === 'pension' ? 'DEMO-1004' : svcId === 'caste-certificate' ? 'DEMO-1005' : 'DEMO-1001';
  const scopes = [...def.requiredSources];

  // Create application
  const created = await call('applications', {
    service: svcId,
    citizenId,
    scopes,
    accepted: true,
  }, 201);
  assert.ok(created.application.id.startsWith(def.referencePrefix));
  assert.equal(created.application.service, svcId);
  assert.equal(created.application.status, 'draft');

  // Verify all required department sources
  for (const dept of scopes) {
    const check = await call(`departments/${dept}/${citizenId}?applicationId=${created.application.id}`);
    assert.equal(check.department, dept);
    assert.ok(check.normalized);
  }

  // Evaluate application
  const evaluated = await call(`applications/${created.application.id}/evaluate`, {
    details: def.detailFields?.length ? { [def.detailFields[0].name]: def.detailFields[0].defaultValue || 'Sample' } : {},
  });
  assert.equal(evaluated.result.status, 'eligible', `${svcId} evaluation failed: ${JSON.stringify(evaluated.result)}`);

  // Submit application
  const submitPayload = { confirmed: true };
  if (svcId === 'scholarship') {
    submitPayload.email = 'applicant@example.com';
    submitPayload.statement = 'I am applying for the higher education merit scholarship program.';
  }
  const submitted = await call(`applications/${created.application.id}/submit`, submitPayload);
  assert.equal(submitted.application.status, 'submitted');

  // Admin Review & Decision
  const decided = await call(`applications/${created.application.id}/decision`, {
    decision: 'approved',
    note: `Automated testing approval for ${def.name}.`,
  });
  assert.equal(decided.application.status, 'approved');

  if (svcId === 'residence') {
    approvedResidenceAppId = created.application.id;
  }

  // Certificate check if supported
  if (def.supportsCertificate) {
    const cert = await call(`applications/${created.application.id}/certificate`);
    assert.equal(cert.certificate.reference, created.application.id);
    assert.ok(cert.certificate.notice.includes('DEMONSTRATION ONLY'));
  }
}

// 2. Timeline Verification (Citizen & Admin)
const citizenTimeline = await call(`applications/${approvedResidenceAppId}/timeline`);
assert.ok(citizenTimeline.events.length >= 3, 'Timeline must have audit records');
const hasConsent = citizenTimeline.events.some((e) => e.action === 'Consent granted');
const hasSubmission = citizenTimeline.events.some((e) => e.action === 'Application submitted');
const hasDecision = citizenTimeline.events.some((e) => e.action === 'Department decision');
assert.ok(hasConsent && hasSubmission && hasDecision, 'Timeline must contain key milestone events');

const adminTimeline = await call(`applications/${approvedResidenceAppId}/timeline`, undefined, 200, {Cookie: adminCookie});
assert.equal(adminTimeline.application.id, approvedResidenceAppId);
assert.equal(adminTimeline.events.length, citizenTimeline.events.length);

// 3. Clarification Workflow Test
const clarifyCitizenId = 'DEMO-1001';
const clarifyApp = await call('applications', {
  service: 'passport',
  citizenId: clarifyCitizenId,
  scopes: services.passport.requiredSources,
  accepted: true,
}, 201);

for (const dept of services.passport.requiredSources) {
  await call(`departments/${dept}/${clarifyCitizenId}?applicationId=${clarifyApp.application.id}`);
}
await call(`applications/${clarifyApp.application.id}/evaluate`, { details: { bookletType: '36 Pages', validityYears: 10 } });
await call(`applications/${clarifyApp.application.id}/submit`, { confirmed: true });

// Admin requests clarification
const askedClarify = await call(`applications/${clarifyApp.application.id}/decision`, {
  decision: 'clarification',
  note: 'Please provide full residential address clarification regarding Flat 12 vs Flat No. 12.',
});
assert.equal(askedClarify.application.status, 'clarification');

// Citizen provides clarification
const responded = await call(`applications/${clarifyApp.application.id}/clarify`, {
  note: 'Flat 12 and Flat No. 12 refer to the identical residential premises in Andheri East.',
});
assert.equal(responded.application.status, 'submitted');

// Admin final approval
const finalApproval = await call(`applications/${clarifyApp.application.id}/decision`, {
  decision: 'approved',
  note: 'Clarification accepted. Address confirmed.',
});
assert.equal(finalApproval.application.status, 'approved');

// 4. Generalized Cross-Service Data Reuse Test
const rationApp = await call('applications', {
  service: 'ration-card',
  citizenId: 'DEMO-1001',
  scopes: services['ration-card'].requiredSources,
  accepted: true,
}, 201);

const reused = await call(`applications/${rationApp.application.id}/reuse-data`, {
  department: 'residence',
  sourceId: approvedResidenceAppId,
});
assert.equal(reused.department, 'residence');
assert.ok(reused.normalized);

// 5. Department & API Registry Metadata Verification
const depts = getAllDepartments();
assert.equal(depts.length, 5);
for (const d of depts) {
  assert.ok(d.name && d.code && d.authority && d.sandboxUrl);
  assert.ok(d.isSimulated);
  assert.ok(d.contracts.length > 0);
  assert.ok(d.slaTargetMs > 0);
}

// 6. Security & Cross-Citizen Isolation Audit
const citizenB = await testAccounts(base);
// Attempt to read Citizen A's application from Citizen B -> 404
await call(`applications/${approvedResidenceAppId}`, undefined, 404, {Cookie: citizenB.cookie});
// Attempt to read Citizen A's timeline from Citizen B -> 404
await call(`applications/${approvedResidenceAppId}/timeline`, undefined, 404, {Cookie: citizenB.cookie});
// Attempt to mutate Citizen A's application from Citizen B -> 404
await call(`applications/${approvedResidenceAppId}/evaluate`, { details: {} }, 404, {Cookie: citizenB.cookie});
// Attempt to revoke Citizen A's consent from Citizen B -> 404
await call(`applications/${approvedResidenceAppId}/revoke`, {}, 404, {Cookie: citizenB.cookie});
// Attempt to submit clarification on Citizen A's application from Citizen B -> 404
await call(`applications/${approvedResidenceAppId}/clarify`, { note: 'Malicious clarification' }, 404, {Cookie: citizenB.cookie});
// CSRF protection: external origin rejected with 403
await call(`applications/${approvedResidenceAppId}/evaluate`, { details: {} }, 403, {Cookie: cookie, Origin: 'https://attacker.example'});
// Anonymous access rejected with 401
await call(`applications/${approvedResidenceAppId}/timeline`, undefined, 401, {Cookie: ''});
// Administrator cannot create citizen application -> 403
await call('applications', { service: 'residence', citizenId: 'DEMO-1001', scopes: ['identity', 'residence', 'documents'], accepted: true }, 403, {Cookie: adminCookie});
// Citizen cannot invoke admin decision endpoint -> 403
await call(`applications/${approvedResidenceAppId}/decision`, { decision: 'approved', note: 'Self-approval attempt' }, 403, {Cookie: cookie});
// Reuse data from an application of another citizen -> 404
const appB = await call('applications', { service: 'ration-card', citizenId: 'DEMO-1002', scopes: services['ration-card'].requiredSources, accepted: true }, 201, {Cookie: citizenB.cookie});
await call(`applications/${appB.application.id}/reuse-data`, { department: 'residence', sourceId: approvedResidenceAppId }, 404, {Cookie: citizenB.cookie});

console.log(`PASS: All 7 services validated end-to-end (${count} HTTP assertions covering creation, multi-department verification, rules evaluation, submission, timeline retrieval, admin decision, clarification loop, cross-service data reuse, registry contracts, and cross-citizen security isolation).`);
